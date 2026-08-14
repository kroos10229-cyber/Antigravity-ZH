# 架构

```text
Antigravity-ZH.app
  └─ launcher.mjs
       ├─ open /Applications/Antigravity.app（启动或前置已有窗口）
       ├─ lsof + /json/version（发现随机仅限本机端口）
       └─ injector.mjs ── Chrome DevTools Protocol（127.0.0.1）──> Electron renderer
                                                                  └─ translate.js + zh-CN.json
                                                                       └─ MutationObserver
```

启动器持续检查 renderer，以便 language server 重启或窗口重新加载后恢复翻译层。翻译器采取精确匹配，并排除代码块、终端、可编辑对话内容及 Monaco/CodeMirror 编辑器，避免影响开发内容。

`agent-instructions/AGENTS.md` 是用于官方 Customizations / Rules 功能的中文交互规则：将其内容粘贴或导入对应设置后生效。外置 DOM 层不能也不会改变模型系统提示词。
