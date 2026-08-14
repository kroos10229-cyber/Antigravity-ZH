# 技术侦察报告

侦察日期：2026-08-14；方式：只读检查。

## 实际发现

| 项目 | 结果 |
| --- | --- |
| 安装位置 | `/Applications/Antigravity.app` |
| Bundle ID | `com.google.antigravity` |
| 版本 | `2.8.0` |
| CPU 架构 | Apple Silicon（arm64） |
| 桌面框架 | Electron（由 `NSPrincipalClass=AtomApplication`、`app.asar` 和 BrowserWindow 代码确认） |
| 主归档 | `Contents/Resources/app.asar`，约 2.6 MB |
| 前端来源 | 应用启动本地 `language_server`，renderer 加载动态的 `https://127.0.0.1:<port>/` 页面 |
| 语言资源 | 归档内未发现项目自有 `i18n`、`locale`、`locales` 或 `zh-CN` 资源 |
| renderer 安全设置 | `nodeIntegration: false`、`contextIsolation: true`；不直接修改 renderer |
| DevTools | 主进程在未提供参数时启用 `remote-debugging-port=0`；实测它在回环地址分配随机端口 |
| 签名保护 | 已 notarize，且 `ElectronAsarIntegrity` 记录 `app.asar` SHA-256；不适合直接修改 |

## 结论

优先方案 A 可实施：启动器启动原始应用后，在回环地址发现其随机 DevTools 端口，通过 Chrome DevTools Protocol 执行本地翻译脚本。实测版本端点显示 Electron 41.0.2（Chrome 146.0.7680.72），renderer 为 `https://127.0.0.1:<随机端口>/`。脚本仅读取页面 DOM 并替换精确匹配的可见 UI 文本、`aria-label`、`title` 和 `placeholder`；不访问 Cookie、Token、网络请求或模型响应。

由于官方包未暴露可复用的 locale 目录，未采用官方本地化资源路径。保留 app.asar 方案仅作理论 fallback，当前没有创建备份、更改归档或重签名应用。
