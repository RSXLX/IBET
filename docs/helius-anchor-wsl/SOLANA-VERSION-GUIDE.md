# Solana CLI 版本更改与管理（WSL/Ubuntu/macOS/Windows）

本文档详细说明如何在不同环境中升级/降级 Solana CLI 到指定版本，并确保与 Anchor 工具链兼容。推荐版本组合：`solana v1.18.x + anchor v0.32.x`。

---

## 1. 快速校验当前版本与路径
```bash
solana --version           # 查看当前 Solana 版本
which solana               # 确认可执行路径（应指向 active_release）
solana-install info        # 查看当前 active_release（若可用）
```
- 期望路径：`$HOME/.local/share/solana/install/active_release/bin/solana`
- 若 `which solana` 指向其它路径，请先修复 PATH（见下文）。

---

## 2. WSL/Ubuntu/macOS：指定版本安装（推荐）
使用官方发布脚本，直装目标版本（最简单可靠）。

```bash
# 以 v1.18.19 为例（带前缀 v）：
sh -c "$(curl -sSfL https://release.solana.com/v1.18.19/install)"

# 确认加入 PATH（如未生效，手动添加并刷新）
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
source ~/.bashrc  # 或 ~/.zshrc

solana --version
```
- 说明：该脚本会在 `~/.local/share/solana/install/releases` 下安装指定版本，并设置 `active_release`。

---

## 3. 切换版本：使用 solana-install（如已安装）
如果你已通过脚本安装过 Solana，通常可以使用 `solana-install` 工具切换版本：

```bash
# 切换到指定版本（带 v 前缀）：
solana-install init v1.18.19

# 更新到最新稳定版：
solana-install update

# 查看当前信息：
solana-install info
```
- 如果 `solana-install` 不存在或不可用，直接执行第 2 节的“指定版本安装”脚本即可。

---

## 4. 修复 PATH 设置（WSL/Ubuntu/macOS）
若 `solana --version` 显示的版本不是你刚安装的，可能 PATH 未指向 `active_release`：

```bash
# 将 active_release 加入 PATH：
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc  # 或 ~/.zshrc
which solana
solana --version
```
- 如仍冲突，检查是否安装过 brew 或其它渠道的 Solana，必要时移除或将其路径置后。

---

## 5. Windows（原生）与 WSL 建议
- 建议在 Windows 上使用 WSL2（Ubuntu）安装与切换 Solana 版本，可靠且与 Anchor/SBF 构建兼容。
- Windows 原生 CLI 的版本管理不如 WSL 顺畅；若必须使用原生，请确保：
  - 不与 WSL 的 PATH 冲突；
  - 安装路径清晰（例如用户目录下的 solana 安装位置），并通过系统环境变量设置优先级。

---

## 6. 兼容性与 Anchor 工具链
- 推荐组合：`solana v1.18.x + anchor v0.32.x`。
- 验证：
```bash
solana --version  # 期望 1.18.x
anchor --version  # 期望 0.32.1（或 0.32.x）
```
- 如 Anchor 版本不符：
```bash
cargo install --git https://github.com/coral-xyz/anchor --tag v0.32.1 anchor-cli
```
- 同步 Rust 依赖与清理后重试：
```bash
cargo update
cargo clean && anchor build
```

---

## 7. 列出/清理旧版本（可选）
```bash
# 列出已安装版本（releases 目录）：
ls -1 ~/.local/share/solana/install/releases

# 查看当前 active_release：
solana-install info

# 不建议手动删除 active_release；如需清理旧版本，确保不是当前使用版本：
# rm -rf ~/.local/share/solana/install/releases/<old_version_dir>
```
- 谨慎清理：错误删除可能破坏 `active_release`，导致 CLI 不可用。

---

## 8. 常见问题与解决
- PATH 冲突：`solana` 指向非 active_release
  - 现象：版本号与预期不一致。
  - 解决：按第 4 节修复 PATH，移除其他渠道安装的 Solana（如 brew）。

- `cargo-build-sbf` 缺失
  - 现象：`unknown command cargo-build-sbf` 或构建时报错。
  - 解决：确保使用官方 release 脚本安装的 Solana；重新安装为目标版本，并刷新 PATH。

- 编译依赖缺失（WSL/Ubuntu）
  - 现象：`linking with 'cc' failed`、`cannot find ...`。
  - 解决：安装通用依赖：
    ```bash
    sudo apt update && sudo apt install -y build-essential pkg-config libssl-dev libudev-dev curl git
    cargo clean && anchor build
    ```

- 证书/网络下载失败（Crates、脚本）
  - 现象：`failed to fetch`、`certificate has expired`。
  - 解决：
    ```bash
    sudo apt install -y ca-certificates
    sudo update-ca-certificates
    ```

- 多环境冲突（WSL 与原生 Windows）
  - 现象：同一机器上 `solana` 指向不同安装源。
  - 解决：分别在各自环境中设置 PATH，不要在 Windows 原生与 WSL 共享同一安装目录。

---

## 9. 回滚示例（从 1.19.x 回到 1.18.19）
```bash
# 方法 A：直接用发布脚本覆盖安装
sh -c "$(curl -sSfL https://release.solana.com/v1.18.19/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version

# 方法 B：使用 solana-install 切换
solana-install init v1.18.19
solana --version
```

---

## 10. 与 Helius/Anchor 的联动建议
- 切换 Solana 版本后，重新验证 Helius RPC 与 Anchor 构建：
```bash
solana config set --url https://rpc.helius.xyz/?api-key=<你的HELIUS_API_KEY>
solana --version && anchor --version
anchor build -v  # 观察详细日志
```
- 如仍有构建异常，将完整日志贴出，我会根据具体报错进一步定位依赖与版本问题。