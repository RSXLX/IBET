# WSL2 + Anchor + Helius 分步部署与联调（Devnet）

本教程将“每个步骤”拆开并详细说明，从环境准备到合约部署与前端联调，最终在 devnet 完成一次真实钱包的 Place Bet 交互。全部操作在 Windows + WSL2（Ubuntu）下进行，RPC 指向 Helius。

---

## 步骤 0：准备 Helius API Key（5 分钟）
- 登录 `helius.dev` 控制台，创建一个 API Key，记下值：`HELIUS_API_KEY`。
- 该 Key 不要泄露；后续会在 CLI 与前端中使用。

---

## 步骤 1：安装 WSL2 与 Ubuntu（10–20 分钟）
- 在 Windows 以管理员权限打开 PowerShell，执行：
```powershell
wsl --install
wsl --set-default-version 2
```
- 重启后在 Microsoft Store 安装 `Ubuntu`（例如 22.04）。首次打开 Ubuntu 完成初始化。

---

## 步骤 2：WSL（Ubuntu）更新与基础依赖（3–5 分钟）
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential pkg-config libssl-dev libudev-dev curl git
```

---

## 步骤 3：安装 Rust（3–5 分钟）
```bash
curl https://sh.rustup.rs -sSf | sh -s -- -y
source "$HOME/.cargo/env"
rustc --version
cargo --version
```

---

## 步骤 4：安装 Solana CLI（建议 v1.18.x）（3–5 分钟）
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.19/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version
```

---

## 步骤 5：安装 Anchor CLI（0.32.1）（5–10 分钟）
```bash
cargo install --git https://github.com/coral-xyz/anchor --tag v0.32.1 anchor-cli
anchor --version
```
> 版本建议：`solana v1.18.x + anchor 0.32.x` 保持兼容。

---

## 步骤 6：进入项目目录（2 分钟）
- Windows 路径：`c:\Users\94447\Desktop\Learn\Ibet`
- WSL 对应路径：`/mnt/c/Users/94447/Desktop/Learn/Ibet`
```bash
cd /mnt/c/Users/94447/Desktop/Learn/Ibet/anchor/levr-bet
ls -la
```
- 确认存在：`Anchor.toml`、`Cargo.toml`、`programs/levr_bet`。

---

## 步骤 7：配置 Helius RPC 与钱包（5 分钟）
1) 将 RPC 设置为 Helius（替换你的 Key）：
```bash
solana config set --url https://devnet.helius-rpc.com/?api-key=fea87872-8801-4ff8-b8db-08138d2d5bed


```
2) 生成/设置默认钱包（与 Anchor.toml 保持一致）：
```bash
solana-keygen new --outfile ~/.config/solana/id.json --force
solana config set --keypair ~/.config/solana/id.json
solana config get
```
3) 领取 Devnet 测试 SOL：
```bash
solana airdrop 2
solana balance
```
> 如空投失败，可临时改用 `https://api.devnet.solana.com` 空投后再切回 Helius。

---

## 步骤 8：对齐 Program ID（3–5 分钟）
- `Anchor.toml` 示例（已存在）：
```toml
[programs.devnet]
levr_bet = "Dhg6Crgi2tcriScveyjehH5GrS4X7LQ4rGmTp91JjAUE"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```
- Anchor 默认使用 `target/deploy/levr_bet-keypair.json` 作为程序 keypair。确保其公钥与 `Anchor.toml` 一致：
```bash
mkdir -p target/deploy
anchor keys list
# 若需新建程序 keypair：
solana-keygen new -o target/deploy/levr_bet-keypair.json --force
solana-keygen pubkey target/deploy/levr_bet-keypair.json
# 同步到 Anchor.toml：
anchor keys sync
```
> 若你没有旧 Program 的私钥，请生成新的并 `anchor keys sync` 更新 `Anchor.toml`。

---

## 步骤 9：编译 Anchor 程序（5–10 分钟）
```bash
anchor build
```
成功后会生成：
- `target/deploy/levr_bet.so`
- `target/idl/levr_bet.json`

### 编译失败常见问题与解决方案
- 版本不兼容（最常见）：
  - 现象：`unknown command cargo-build-sbf` / `failed to run cargo-build-sbf` / 编译期报错与 Anchor/Solana 版本相关。
  - 解决：确保 `solana v1.18.x` 与 `anchor 0.32.x` 搭配；并将依赖与 CLI 对齐：
    ```bash
    solana --version   # 期望 1.18.x
    anchor --version   # 期望 0.32.1
    # 如版本不符，重新安装：
    sh -c "$(curl -sSfL https://release.solana.com/v1.18.19/install)"
    cargo install --git https://github.com/coral-xyz/anchor --tag v0.32.1 anchor-cli
    ```
  - 同步 Rust 依赖：
    ```bash
    cargo update
    cargo clean && anchor build
    ```

- SBF 工具链缺失/损坏：
  - 现象：`llvm`/`clang` 找不到、`solana` 内置工具链路径报错。
  - 解决：重装/更新 Solana 工具链，并校验环境变量：
    ```bash
    solana-install update
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    which solana
    solana --version
    ```

- WSL 依赖缺失或 C 编译失败：
  - 现象：`linking with 'cc' failed`、`cannot find` 之类的系统依赖错误。
  - 解决：安装通用构建依赖后重试：
    ```bash
    sudo apt update && sudo apt install -y build-essential pkg-config libssl-dev libudev-dev curl git
    cargo clean && anchor build
    ```

- Windows 挂载路径导致权限/性能问题：
  - 现象：在 `/mnt/c/...` 路径下构建出现奇怪的权限或路径问题、编译缓慢。
  - 解决：将项目拷贝到 WSL 原生目录后再编译（例如 `~/work/levr-bet`）：
    ```bash
    mkdir -p ~/work && cp -r /mnt/c/Users/94447/Desktop/Learn/Ibet/anchor/levr-bet ~/work/
    cd ~/work/levr-bet && anchor build
    ```

- Crates 下载/锁文件问题：
  - 现象：`failed to fetch`、`Cargo.lock` 冲突或网络问题。
  - 解决：
    ```bash
    sudo apt install -y ca-certificates
    cargo update -p anchor-lang -p anchor-spl
    rm -rf target && cargo clean && anchor build
    ```

- Anchor 依赖/特性设置不当：
  - 现象：`feature 'idl-build'` 相关报错或依赖版本不一致。
  - 解决：确保 `programs/levr_bet/Cargo.toml` 中：
    ```toml
    [dependencies]
    anchor-lang = "0.32.1"
    anchor-spl = "0.32.1"
    [features]
    idl-build = ["anchor-lang/idl-build"]
    ```
    若仍报错，临时移除 `idl-build` 特性再次尝试：
    ```toml
    [features]
    default = []
    # 暂不启用 idl-build
    ```

- 彻底清理后重试（强力修复）：
  ```bash
  rm -rf target
  cargo clean
  anchor build -v        # 打印更详细日志
  ```

- 备用方案（容器内构建）：
  - 适用：WSL 环境不稳定或依赖难以修复。
  - 用 Docker 构建 `.so`，再用 CLI 部署：
    ```powershell
    # Windows 下（以管理员或普通 PowerShell）
    docker run --rm -v "${PWD}\anchor\levr-bet:/work" -w /work coralxyz/anchor:0.32 anchor build
    ```
    然后在本机（WSL/Windows）使用 `solana program deploy target/deploy/levr_bet.so`。

> 若仍无法编译，请将完整错误日志粘贴出来（`anchor build -v`），我会根据具体报错定位依赖和版本问题。

---

## 步骤 10：部署到 Devnet（3–5 分钟）
```bash
anchor deploy
```
- 记录输出中的 `Signature`（交易签名）用于确认；确保使用的是 Helius RPC。

---

## 步骤 11：验证部署与导出 IDL（3–5 分钟）
```bash
# 查看程序信息（替换为你的 ProgramID）
solana program show Dhg6Crgi2tcriScveyjehH5GrS4X7LQ4rGmTp91JjAUE

# 确认部署交易
solana confirm -v <Signature>

# 导出 IDL（可用于前端）
anchor idl dump Dhg6Crgi2tcriScveyjehH5GrS4X7LQ4rGmTp91JjAUE > idl.json
```
> 也可直接使用构建生成的 `target/idl/levr_bet.json`。

---

## 步骤 12：前端联调（Predix）（5–10 分钟）
1) 在 `Predix/.env.local` 写入（替换 Key）：
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=HELIUS_API_KEY
```
2) 若前端需要 Anchor SDK：
```bash
cd /mnt/c/Users/94447/Desktop/Learn/Ibet/Predix
npm i @coral-xyz/anchor @solana/web3.js
```
3) 最小示例（加载 IDL 与 Program）：
```ts
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
const connection = new Connection(endpoint, 'confirmed');
// TODO: 使用钱包适配器初始化 wallet 与 provider
// const wallet = ...
// const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

const idl: Idl = await fetch('/idl/levr_bet.json').then(r => r.json());
const programId = new PublicKey('Dhg6Crgi2tcriScveyjehH5GrS4X7LQ4rGmTp91JjAUE');
const program = new Program(idl, programId, provider);
```

---

## 步骤 13：Place Bet 演示（SOL 基线）（10–15 分钟）
- 前提：合约已实现 `initialize_config`、`open_market`、`place_bet`。市场处于 `Open`。
- 调用示例（伪代码，按你的 IDL 方法名与账户改写）：
```ts
// 计算或读取 market_pda 与 bet_pda
// const marketPda = ...; const betPda = ...;

await program.methods
  .placeBet(/* market_id, selected_team, amount, multiplier_bps */)
  .accounts({
    user: wallet.publicKey,
    market: marketPda,
    config: configPda,
    bet: betPda,
    systemProgram: new PublicKey('11111111111111111111111111111111'),
  })
  .rpc();
```
- 结果：交易签名在 UI 中展示；可在 Helius Devnet 查询到日志与事件。

---

## 步骤 14：故障排查（随时）
- 编译失败：检查 `solana v1.18.x + anchor 0.32.x`，`cargo clean` 后重试；确认 WSL 依赖齐全。
- ProgramID 不匹配：确保 `target/deploy/levr_bet-keypair.json` 的公钥与 `Anchor.toml` 一致；`anchor keys sync`。
- 空投失败/网络拥堵：重试或临时使用官方 Devnet 空投；稍后切回 Helius。
- 前端连不上：确认 `.env.local` 的 RPC 正确、钱包适配器已初始化、IDL/ProgramID 路径与值正确。

---

## 完成标志
- 在 Devnet 上成功部署 `levr_bet`，能从前端完成一次真实钱包的 `place_bet` 调用，并在 Helius 查询到交易与事件。
- 已生成并加载 IDL（`public/idl/levr_bet.json` 或远程路径）。

> 继续迭代：实现 `resolve_market` 与 `claim_payout`，在兑付时扣取 `fee_bps` 并写入 `pnl`；随后完善取消/退款与 SPL 托管扩展。