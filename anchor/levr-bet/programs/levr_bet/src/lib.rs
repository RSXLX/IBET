#![allow(clippy::result_large_err)]
use anchor_lang::prelude::*;
use anchor_lang::system_program;

// 占位 Program ID；GitHub Actions 将通过 `anchor keys sync` 自动更新
declare_id!("Dhg6Crgi2tcriScveyjehH5GrS4X7LQ4rGmTp91JjAUE");

pub const SCALE_BPS: u64 = 10_000; // 统一缩放比例

#[program]
pub mod levr_bet {
    use super::*;

    // M0：初始化配置（SOL 基线）
    pub fn initialize_config(ctx: Context<InitializeConfig>, params: InitializeConfigParams) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        cfg.authority = ctx.accounts.authority.key();
        cfg.base_mint = params.base_mint;
        cfg.fee_bps = params.fee_bps;
        cfg.house_cut_bps = params.house_cut_bps;
        cfg.min_bet = params.min_bet;
        cfg.max_bet = params.max_bet;
        cfg.max_odds_bps = params.max_odds_bps;
        cfg.max_multiplier_bps = params.max_multiplier_bps;
        cfg.treasury_sol = params.treasury_sol;
        cfg.bump = *ctx.bumps.get("config").unwrap();
        Ok(())
    }

    // M1：开启市场（基于 market_id_seed 派生 PDA）
    pub fn open_market(ctx: Context<OpenMarket>, args: OpenMarketArgs) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_keys_eq!(cfg.authority, ctx.accounts.authority.key(), LevrBetError::Unauthorized);

        let market = &mut ctx.accounts.market;
        market.market_id_seed = args.market_id_seed;
        market.home_code = args.home_code;
        market.away_code = args.away_code;
        market.start_time = args.start_time;
        market.close_time = args.close_time;
        market.state = MarketState::Open as u8;
        market.result = 0;
        market.odds_home_bps = args.odds_home_bps;
        market.odds_away_bps = args.odds_away_bps;
        market.max_exposure = args.max_exposure;
        market.exposure = 0;
        market.bump = *ctx.bumps.get("market").unwrap();
        market.escrow_bump = *ctx.bumps.get("escrow").unwrap_or(&0u8);
        Ok(())
    }

    // M1：下单（SOL 路径）
    pub fn place_bet(ctx: Context<PlaceBet>, args: PlaceBetArgs) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let market = &mut ctx.accounts.market;
        let user = &ctx.accounts.user;
        let escrow = &ctx.accounts.escrow;

        // 校验市场与下注参数
        require!(market.state == MarketState::Open as u8, LevrBetError::MarketClosed);
        require!(args.amount >= cfg.min_bet && args.amount <= cfg.max_bet, LevrBetError::AmountOutOfRange);
        require!(args.multiplier_bps >= SCALE_BPS && args.multiplier_bps <= cfg.max_multiplier_bps, LevrBetError::InvalidMultiplier);
        require!(args.selected_team == 1 || args.selected_team == 2, LevrBetError::InvalidTeam);

        let odds_bps = match args.selected_team {
            1 => market.odds_home_bps,
            _ => market.odds_away_bps,
        } as u64;
        require!(odds_bps <= cfg.max_odds_bps as u64 && odds_bps >= SCALE_BPS, LevrBetError::InvalidOdds);

        // 风控：风险敞口
        let new_exposure = market.exposure.checked_add(args.amount).ok_or(LevrBetError::Overflow)?;
        require!(new_exposure <= market.max_exposure, LevrBetError::MaxExposureExceeded);

        // 计算预期收益（含本金）：amount * odds * multiplier / SCALE^2
        let payout_expected: u64 = ((args.amount as u128)
            .checked_mul(odds_bps as u128).ok_or(LevrBetError::Overflow)?
            .checked_mul(args.multiplier_bps as u128).ok_or(LevrBetError::Overflow)?
            / ((SCALE_BPS as u128) * (SCALE_BPS as u128))) as u64;

        // SOL 转账：用户 -> 市场 Escrow PDA
        let cpi = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: user.to_account_info(),
                to: escrow.to_account_info(),
            },
        );
        system_program::transfer(cpi, args.amount)?;

        // 初始化 BetAccount
        let bet = &mut ctx.accounts.bet;
        bet.user = user.key();
        bet.market = market.key();
        bet.nonce = args.nonce;
        bet.selected_team = args.selected_team;
        bet.odds_home_bps = market.odds_home_bps;
        bet.odds_away_bps = market.odds_away_bps;
        bet.multiplier_bps = args.multiplier_bps;
        bet.amount = args.amount;
        bet.payout_expected = payout_expected;
        bet.timestamp = Clock::get()?.unix_timestamp;
        bet.status = BetStatus::Placed as u8;
        bet.claimed = false;
        bet.pnl = 0;
        bet.bump = *ctx.bumps.get("bet").unwrap();

        // 更新市场敞口
        market.exposure = new_exposure;

        emit!(EventBetPlaced {
            user: bet.user,
            market: bet.market,
            team: bet.selected_team,
            amount: bet.amount,
            odds_bps,
            multiplier_bps: bet.multiplier_bps as u64,
        });
        Ok(())
    }

    // M2：裁决比赛结果（仅管理员）
    pub fn resolve_market(ctx: Context<ResolveMarket>, result: u8) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_keys_eq!(cfg.authority, ctx.accounts.authority.key(), LevrBetError::Unauthorized);
        require!(result == 1 || result == 2, LevrBetError::InvalidResult);
        let market = &mut ctx.accounts.market;
        market.result = result;
        market.state = MarketState::Resolved as u8;
        emit!(EventMarketResolved { market: market.key(), result });
        Ok(())
    }

    // M2：兑付（赢家领取，扣除平台费）
    pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let market = &mut ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;

        require!(market.state == MarketState::Resolved as u8, LevrBetError::MarketNotResolved);
        require!(!bet.claimed, LevrBetError::AlreadyClaimed);
        require_keys_eq!(bet.user, ctx.accounts.user.key(), LevrBetError::Unauthorized);
        require_keys_eq!(bet.market, market.key(), LevrBetError::BetNotFound);

        let winner = market.result == bet.selected_team;
        let mut payout: u64 = 0;
        let mut fee: u64 = 0;
        let mut pnl: i64 = 0;

        if winner {
            payout = bet.payout_expected;
            fee = ((payout as u128)
                .checked_mul(cfg.fee_bps as u128).ok_or(LevrBetError::Overflow)?
                / (SCALE_BPS as u128)) as u64;
            pnl = payout as i64 - bet.amount as i64;
        } else {
            payout = 0;
            fee = 0;
            pnl = -(bet.amount as i64);
        }

        let escrow = &ctx.accounts.escrow;
        let system = &ctx.accounts.system_program;

        // 赢家：先扣平台费到 treasury，再将净额转给用户
        if payout > 0 {
            if let Some(treasury_key) = cfg.treasury_sol {
                require_keys_eq!(treasury_key, ctx.accounts.treasury.key(), LevrBetError::Unauthorized);

                if fee > 0 {
                    let signer = &[&[b"escrow", market.key().as_ref(), b"SOL", &[market.escrow_bump]]];
                    let cpi_fee = CpiContext::new_with_signer(
                        system.to_account_info(),
                        system_program::Transfer {
                            from: escrow.to_account_info(),
                            to: ctx.accounts.treasury.to_account_info(),
                        },
                        signer,
                    );
                    system_program::transfer(cpi_fee, fee)?;
                }
            }

            let net = payout.checked_sub(fee).ok_or(LevrBetError::Overflow)?;
            let signer = &[&[b"escrow", market.key().as_ref(), b"SOL", &[market.escrow_bump]]];
            let cpi_user = CpiContext::new_with_signer(
                system.to_account_info(),
                system_program::Transfer {
                    from: escrow.to_account_info(),
                    to: ctx.accounts.user.to_account_info(),
                },
                signer,
            );
            system_program::transfer(cpi_user, net)?;
        }

        // 更新状态与市场敞口
        bet.status = if winner { BetStatus::SettledWin as u8 } else { BetStatus::SettledLose as u8 };
        bet.claimed = true;
        bet.pnl = pnl;
        market.exposure = market.exposure.checked_sub(bet.amount).unwrap_or(market.exposure);

        emit!(EventBetClaimed {
            user: bet.user,
            market: bet.market,
            payout: payout,
            pnl,
        });
        Ok(())
    }
}

// -----------------------------
// 账户与数据结构
// -----------------------------
#[account]
pub struct ConfigAccount {
    pub authority: Pubkey,
    pub base_mint: Option<Pubkey>, // None 表示 SOL
    pub fee_bps: u16,
    pub house_cut_bps: u16,
    pub min_bet: u64,
    pub max_bet: u64,
    pub max_odds_bps: u32,
    pub max_multiplier_bps: u32,
    pub treasury_sol: Option<Pubkey>,
    pub bump: u8,
}
impl ConfigAccount {
    pub const MAX_SIZE: usize = 32 + 1 + 32 + 2 + 2 + 8 + 8 + 4 + 4 + 1 + 32 + 1;
}

#[account]
pub struct MarketAccount {
    pub market_id_seed: [u8; 32],
    pub home_code: u64,
    pub away_code: u64,
    pub start_time: i64,
    pub close_time: i64,
    pub state: u8, // MarketState
    pub result: u8, // 0=None, 1=Home, 2=Away
    pub odds_home_bps: u32,
    pub odds_away_bps: u32,
    pub max_exposure: u64,
    pub exposure: u64,
    pub bump: u8,
    pub escrow_bump: u8,
}
impl MarketAccount {
    pub const MAX_SIZE: usize = 32 + 8 + 8 + 8 + 8 + 1 + 1 + 4 + 4 + 8 + 8 + 1 + 1;
}

#[account]
pub struct BetAccount {
    pub user: Pubkey,
    pub market: Pubkey,
    pub nonce: u64,
    pub selected_team: u8, // 1|2
    pub odds_home_bps: u32,
    pub odds_away_bps: u32,
    pub multiplier_bps: u32,
    pub amount: u64,
    pub payout_expected: u64,
    pub timestamp: i64,
    pub status: u8, // BetStatus
    pub claimed: bool,
    pub pnl: i64,
    pub bump: u8,
}
impl BetAccount {
    pub const MAX_SIZE: usize = 32 + 32 + 8 + 1 + 4 + 4 + 4 + 8 + 8 + 8 + 1 + 1 + 8 + 1;
}

// -----------------------------
// 指令参数
// -----------------------------
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeConfigParams {
    pub base_mint: Option<Pubkey>,
    pub fee_bps: u16,
    pub house_cut_bps: u16,
    pub min_bet: u64,
    pub max_bet: u64,
    pub max_odds_bps: u32,
    pub max_multiplier_bps: u32,
    pub treasury_sol: Option<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OpenMarketArgs {
    pub market_id_seed: [u8; 32],
    pub home_code: u64,
    pub away_code: u64,
    pub start_time: i64,
    pub close_time: i64,
    pub odds_home_bps: u32,
    pub odds_away_bps: u32,
    pub max_exposure: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PlaceBetArgs {
    pub selected_team: u8,
    pub amount: u64,
    pub multiplier_bps: u32,
    pub nonce: u64,
}

// -----------------------------
// 账户约束
// -----------------------------
#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        seeds = [b"config"],
        bump,
        space = 8 + ConfigAccount::MAX_SIZE,
    )]
    pub config: Account<'info, ConfigAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: OpenMarketArgs)]
pub struct OpenMarket<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub config: Account<'info, ConfigAccount>,
    #[account(
        init,
        payer = authority,
        seeds = [b"market", args.market_id_seed.as_ref()],
        bump,
        space = 8 + MarketAccount::MAX_SIZE,
    )]
    pub market: Account<'info, MarketAccount>,
    #[account(
        init,
        payer = authority,
        seeds = [b"escrow", market.key().as_ref(), b"SOL"],
        bump,
        // SystemAccount 用于持有 lamports，无需额外空间
        space = 8,
    )]
    pub escrow: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: PlaceBetArgs)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub config: Account<'info, ConfigAccount>,
    #[account(mut)]
    pub market: Account<'info, MarketAccount>,
    #[account(
        mut,
        seeds = [b"escrow", market.key().as_ref(), b"SOL"],
        bump = market.escrow_bump,
    )]
    pub escrow: SystemAccount<'info>,
    #[account(
        init,
        payer = user,
        seeds = [b"bet", user.key().as_ref(), market.key().as_ref(), &args.nonce.to_le_bytes()],
        bump,
        space = 8 + BetAccount::MAX_SIZE,
    )]
    pub bet: Account<'info, BetAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub config: Account<'info, ConfigAccount>,
    #[account(mut)]
    pub market: Account<'info, MarketAccount>,
}

#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub config: Account<'info, ConfigAccount>,
    #[account(mut)]
    pub market: Account<'info, MarketAccount>,
    #[account(mut, has_one = user, has_one = market)]
    pub bet: Account<'info, BetAccount>,
    #[account(
        mut,
        seeds = [b"escrow", market.key().as_ref(), b"SOL"],
        bump = market.escrow_bump,
    )]
    pub escrow: SystemAccount<'info>,
    /// CHECK: 平台费接收账户，由配置指定
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

// -----------------------------
// 事件
// -----------------------------
#[event]
pub struct EventBetPlaced {
    pub user: Pubkey,
    pub market: Pubkey,
    pub team: u8,
    pub amount: u64,
    pub odds_bps: u64,
    pub multiplier_bps: u64,
}

#[event]
pub struct EventMarketResolved {
    pub market: Pubkey,
    pub result: u8,
}

#[event]
pub struct EventBetClaimed {
    pub user: Pubkey,
    pub market: Pubkey,
    pub payout: u64,
    pub pnl: i64,
}

// -----------------------------
// 错误码
// -----------------------------
#[error_code]
pub enum LevrBetError {
    #[msg("Unauthorized")] Unauthorized,
    #[msg("MarketClosed")] MarketClosed,
    #[msg("MarketNotResolved")] MarketNotResolved,
    #[msg("InvalidOdds")] InvalidOdds,
    #[msg("InvalidMultiplier")] InvalidMultiplier,
    #[msg("InvalidTeam")] InvalidTeam,
    #[msg("InvalidResult")] InvalidResult,
    #[msg("AmountOutOfRange")] AmountOutOfRange,
    #[msg("InsufficientFunds")] InsufficientFunds,
    #[msg("MaxExposureExceeded")] MaxExposureExceeded,
    #[msg("AlreadyClaimed")] AlreadyClaimed,
    #[msg("BetNotFound")] BetNotFound,
    #[msg("Overflow")] Overflow,
}

// -----------------------------
// 状态枚举（字节存储）
// -----------------------------
pub enum MarketState {
    Open = 1,
    Closed = 2,
    Resolved = 3,
    Canceled = 4,
}

pub enum BetStatus {
    Placed = 1,
    SettledWin = 2,
    SettledLose = 3,
    Canceled = 4,
    Refunded = 5,
}