# WSL2 + Anchor + Helius Devnet 三小时部署指南

本指南手把手带你在 Windows 上使用 WSL2 + Anchor CLI，通过 Helius RPC 将 `anchor/levr-bet` 合约部署到 Solana Devnet，并完成上链验证与前端联调。按步骤执行，整体用时可控在 ≤ 3 小时。

## 快速概览
- 目标：在 Devnet 成功部署 `levr_bet` 程序（Program ID 与 Anchor.toml 对齐），RPC 指向 Helius。
- 前置：Windows 10/11、管理员权限、已注册 Helius 并拿到 API Key。
- 交付：合约成功上链、生成 IDL、前端读取 Helius RPC 并可调用程序方法。

---

## 0. 准备工作（Windows）
1) 获取 Helius API Key：登录 helius.dev 控制台创建一个 `API Key`，记下值，例如 `HELIUS_API_KEY=xxxxxxxx`。
2) 打开 PowerShell（管理员）：执行以下命令安装 WSL2 与 Ubuntu：

```powershell
wsl --install
wsl --set-default-version 2
```

重启后在 Microsoft Store 安装 Ubuntu（如 `Ubuntu 22.04`）。

---

## 1. 初始化 WSL2 环境（Ubuntu）
1) 更新系统与基础依赖：
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential pkg-config libssl-dev libudev-dev curl git
```

2) 安装 Rust（稳定版）：
```bash
curl https://sh.rustup.rs -sSf | sh -s -- -y
source "$HOME/.cargo/env"
```

3) 安装 Solana CLI（建议 v1.18.x 与 Anchor 0.32.x 兼容）：
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.19/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version
```

4) 安装 Anchor CLI（0.32.1）：
```bash
cargo install --git https://github.com/coral-xyz/anchor --tag v0.32.1 anchor-cli
anchor --version
```

---

## 2. 进入项目路径（WSL 挂载 Windows 路径）
你的仓库在 Windows 路径：`c:\Users\94447\Desktop\Learn\Ibet`。
在 WSL 中对应路径为：`/mnt/c/Users/94447/Desktop/Learn/Ibet`。

```bash
cd /mnt/c/Users/94447/Desktop/Learn/Ibet/anchor/levr-bet
ls -la
```

确认存在：`Anchor.toml`、`Cargo.toml`、`programs/levr_bet`。

---

## 3. 配置 Helius RPC 与钱包（Devnet）
1) 设置 RPC 到 Helius（替换你的 API Key）：
```bash
solana config set --url https://rpc.helius.xyz/?api-key=HELIUS_API_KEY
```

2) 生成或导入钱包到默认路径（与 Anchor.toml 对齐）：
```bash
solana-keygen new --outfile ~/.config/solana/id.json --force
solana config set --keypair ~/.config/solana/id.json
solana config get
```

3) Devnet 领取空投（如果失败，稍等重试）：
```bash
solana airdrop 2
solana balance
```

> 提示：如 Helius 空投失败，可暂时将 RPC 切到 `https://api.devnet.solana.com` 领取，再切回 Helius。

---

## 4. 程序 ID 与 keypair 对齐（Anchor 关键步骤）
- 当前 `Anchor.toml`：
```toml
[programs.devnet]
levr_bet = "Dhg6Crgi2tcriScveyjehH5GrS4X7LQ4rGmTp91JjAUE"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

- Anchor 部署时使用 `target/deploy/levr_bet-keypair.json` 作为程序 keypair，必须与 `Anchor.toml` 的 Program ID 一致。

1) 查看当前程序 keypair（如果不存在需要创建）：
```bash
mkdir -p target/deploy
anchor keys list  # 若无输出，说明还未生成程序 keypair
```

2) 生成程序 keypair（仅首次或你需要新 Program ID 时）：
```bash
solana-keygen new -o target/deploy/levr_bet-keypair.json --force
solana-keygen pubkey target/deploy/levr_bet-keypair.json
# 输出的公钥例如：NewProgramPubkey
```

3) 同步 Anchor.toml 的 Program ID：
- 如果 `NewProgramPubkey` 与 `Anchor.toml` 不一致，执行：
```bash
anchor keys sync
```
这会将 `Anchor.toml` 对应网络的 `levr_bet` 更新为本地 `target/deploy/levr_bet-keypair.json` 的公钥。

> 说明：已有的 `Dhg6Cr...` 可继续使用，前提是你持有对应的程序 keypair。如果没有该私钥，需按上面步骤生成新 keypair 并同步 `Anchor.toml`。

---

## 5. 编译与部署到 Devnet（走 Helius RPC）
1) 编译：
```bash
anchor build
```
编译成功后会生成：
- `target/deploy/levr_bet.so`（程序二进制）
- `target/idl/levr_bet.json`（IDL 文件）

2) 部署：
```bash
anchor deploy
```
记录最后一笔交易签名（`Signature`），用于确认部署。

---

## 6. 上链验证与 IDL 导出
1) 查看程序信息：
```bash
solana program show <ProgramID>
# 例如：solana program show Dhg6Crgi2tcriScveyjehH5GrS4X7LQ4rGmTp91JjAUE
```

2) 确认部署交易：
```bash
solana confirm -v <Signature>
```

3) 导出 IDL（如需重新生成或备份）：
```bash
anchor idl dump <ProgramID> > idl.json
# 或使用构建生成的：target/idl/levr_bet.json
```

---

## 7. 前端联调（Predix 项目）
1) 在 `Predix` 根目录创建 `.env.local`，写入：
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=HELIUS_API_KEY
```

`lib/solana.ts` 已支持优先使用 `NEXT_PUBLIC_SOLANA_RPC_URL`，否则回退 `clusterApiUrl(network)`。

2) 安装依赖（如前端需要直接用 Anchor SDK）：
```bash
cd /mnt/c/Users/94447/Desktop/Learn/Ibet/Predix
npm i @coral-xyz/anchor @solana/web3.js
```

3) 在前端使用 IDL 与 Program ID（示例）：
```ts
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
const connection = new Connection(endpoint, 'confirmed');
// TODO: 根据你的钱包集成（如钱包适配器）初始化 provider：
// const wallet = ...
// const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

// 建议将 idl 文件放到 Next 的 public 目录，例如：public/idl/levr_bet.json
const idl: Idl = await fetch('/idl/levr_bet.json').then(r => r.json());
const programId = new PublicKey('<ProgramID>');
const program = new Program(idl, programId, provider);
```

4) 运行前端：
```bash
npm run dev
# 访问 http://localhost:3000/
```

---

## 8. 常见问题排查
- 编译错误：优先检查 `solana v1.18.x + anchor 0.32.x` 版本兼容；尝试 `cargo clean` 后重试；确保 WSL 中安装了 `build-essential` 等依赖。
- 空投失败：多次重试或临时改用 `https://api.devnet.solana.com` 领取，完成后再切回 Helius。
- 部署失败（Program ID 不匹配）：确认 `target/deploy/levr_bet-keypair.json` 的公钥与 `Anchor.toml` 一致；如不一致，运行 `anchor keys sync`。
- 权限/路径：尽量在 WSL 的同一环境里完成编译与部署；Windows 与 WSL 路径交叉时注意权限与文件换行符。

---

## 9. 时间拆解（参考 ≤ 3 小时）
- WSL 安装与系统更新：30–45 分钟（已安装则忽略）
- 工具链安装（Rust/Solana/Anchor）：30–45 分钟
- 编译与部署：15–30 分钟
- 验证与前端联调：20–30 分钟

---

## 10. 附录：命令速查
```bash
# 设定 Helius RPC
solana config set --url https://rpc.helius.xyz/?api-key=HELIUS_API_KEY

# 生成钱包并空投
solana-keygen new --outfile ~/.config/solana/id.json --force
solana airdrop 2 && solana balance

# 程序 keypair 与 Anchor.toml 对齐
solana-keygen new -o target/deploy/levr_bet-keypair.json --force
solana-keygen pubkey target/deploy/levr_bet-keypair.json
anchor keys sync

# 编译与部署
anchor build
anchor deploy

# 验证与 IDL
solana program show <ProgramID>
solana confirm -v <Signature>
anchor idl dump <ProgramID> > idl.json
```

> 完成上述步骤后，你的 `levr_bet` 已部署到 Devnet（通过 Helius RPC），前端也可在 `.env.local` 将 RPC 指向 Helius 并进行交互。