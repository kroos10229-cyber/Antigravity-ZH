# Antigravity-ZH

面向 macOS 上 Google Antigravity 2.23.0 的非官方简体中文 UI 增强工具。它不修改 `/Applications/Antigravity.app`，不读取账户凭证、不拦截网络请求，也不改变模型响应或权限机制。

> 本项目与 Google 或 Antigravity 没有隶属、赞助或认可关系。仓库不包含官方 Antigravity 的程序、图标或其他品牌资源；构建脚本只会从使用者已安装的官方应用中读取图标。

## 使用

前提：已安装官方 Antigravity 2.23.0 和 Node.js 22 或更高版本。发布包内置译文，使用者不需要安装离线翻译模型。

1. 双击 `Antigravity-ZH.app`。启动器的运行文件已内置在 app 中，因此可单独移动该 app。
2. 启动器会打开官方 Antigravity，发现其仅限本机的随机 DevTools 端口，并把翻译层附着到 renderer。
3. 可选：将 [`agent-instructions/AGENTS.md`](agent-instructions/AGENTS.md) 的内容加入 Antigravity 的 Customizations / Rules，令 Agent 默认用简体中文回答。界面汉化本身不改变模型回答。
4. 在应用运行时执行 `scripts/update.sh`，生成实际界面的未翻译字符串报告。

首次从源码取得项目后，先执行以下命令来生成启动器的内置资源与图标：

```sh
scripts/build-app.sh
```

## 本轮补全范围

导航、项目菜单、自动化、设置、权限、外观、模型用量、错误提示和工具提示；扩展市场 17 项官方插件的概览、示例提示及技能介绍，并纳入 139 份官方技能正文、官方子智能体与规则说明，以及当前界面资源中发现的静态文案。

短文案位于 `translations/zh-CN.json`，长文位于 `translations/details.zh-CN.json`，人工校正的界面术语位于 `translations/ui-reviewed.zh-CN.json`。支持跨行句子、Markdown 片段和动态数量；相同词库不重复注入。

本机私人技能译文可保存在 `~/Library/Application Support/Antigravity-ZH/local.zh-CN.json`，或由 `ANTIGRAVITY_ZH_LOCAL_TRANSLATIONS` 指向独立文件。这个缓存不会打入发布包；开发时须离线生成，不能上传私人规则或技能内容到翻译服务。没有此缓存不影响公共界面汉化。

验收记录见 [`docs/UI_AUDIT.md`](docs/UI_AUDIT.md)。正文采用机器翻译并校正主要术语，不等于逐句人工审校，也不以单页扫描数字代表全应用覆盖率。

## 限制与安全边界

- 依赖官方 2.23.0 已验证的本地 DevTools 接口；升级后先运行 `scripts/update.sh`。扫描仅覆盖当前打开界面，不代表全应用覆盖率。
- 翻译界面及技能说明；代码块、命令、终端、文件名、URL、可编辑内容和用户/模型对话正文保持原样。部分长句采用受限片段匹配。
- 外部汉化只作用于 Electron 网页界面；macOS 原生菜单、原生崩溃窗口及新版本新增的未知文案不在已验证范围内。
- 不使用 app.asar 补丁；`restore.sh` 不需要恢复官方应用。
- 若自动发现失败，可设置环境变量 `ANTIGRAVITY_ZH_DEBUG_PORT` 为当前 Antigravity 的本机 DevTools 端口后从终端启动 launcher。
- 可以将 `Antigravity-ZH.app` 拖到 Dock。它使用官方 Antigravity 图标；启动后会立即退出 Dock，仅由官方 Antigravity 的窗口图标留在 Dock 中。

## 开发命令

```sh
scripts/update.sh              # 记录官方版本并扫描当前 renderer
node src/injector/injector.mjs # 向已打开的 renderer 单次注入
node src/scanner/test-translator.mjs # 检查译文、幂等性和内容保护
```
