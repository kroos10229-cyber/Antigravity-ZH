# Antigravity-ZH

面向 macOS 上 Google Antigravity 2.22.0 的非官方简体中文 UI 增强工具。它不修改 `/Applications/Antigravity.app`，不读取账户凭证、不拦截网络请求，也不改变模型响应或权限机制。

> 本项目与 Google 或 Antigravity 没有隶属、赞助或认可关系。仓库不包含官方 Antigravity 的程序、图标或其他品牌资源；构建脚本只会从使用者已安装的官方应用中读取图标。

## 使用

1. 双击 `Antigravity-ZH.app`。启动器的运行文件已内置在 app 中，因此可单独移动该 app。
2. 启动器会打开官方 Antigravity，发现其仅限本机的随机 DevTools 端口，并把翻译层附着到 renderer。
3. 将 [`agent-instructions/AGENTS.md`](agent-instructions/AGENTS.md) 的内容加入 Antigravity 的 Customizations / Rules，令 Agent 默认使用简体中文。
4. 在应用运行时执行 `scripts/update.sh`，生成实际界面的未翻译字符串报告。

首次从源码取得项目后，先执行以下命令来生成启动器的内置资源与图标：

```sh
scripts/build-app.sh
```

## 已覆盖的 MVP 区域

左侧导航、项目/对话常用动作、运行中的任务、定时任务、工件、权限对话框、设置与常用工具提示。翻译表位于 `translations/zh-CN.json`，可按扫描报告继续补充。

## 限制与安全边界

- 依赖官方 2.22.0 已验证的本地 DevTools 接口；升级后先运行 `scripts/update.sh`。扫描仅覆盖当前打开界面，不代表全应用覆盖率。
- 只翻译精确匹配的 UI 字符串，代码、命令、终端输出、路径、URL、模型名及可编辑聊天内容保持原样。
- 不使用 app.asar 补丁；`restore.sh` 不需要恢复官方应用。
- 若自动发现失败，可设置环境变量 `ANTIGRAVITY_ZH_DEBUG_PORT` 为当前 Antigravity 的本机 DevTools 端口后从终端启动 launcher。
- 可以将 `Antigravity-ZH.app` 拖到 Dock。它使用官方 Antigravity 图标；启动后会立即退出 Dock，仅由官方 Antigravity 的窗口图标留在 Dock 中。

## 开发命令

```sh
scripts/update.sh              # 记录官方版本并扫描当前 renderer
node src/injector/injector.mjs # 向已打开的 renderer 单次注入
```
