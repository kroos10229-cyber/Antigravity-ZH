#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { discoverDevToolsPort, evaluate, getTargets } from '../injector/injector.mjs';

const reportPath = new URL('../../reports/untranslated.md', import.meta.url);

const expression = `(() => {
  const blocked = 'code,pre,kbd,samp,script,style,textarea,[contenteditable="true"],.cm-content,.monaco-editor,[data-testid*="terminal" i],[data-testid*="chat-message" i]';
  const visible = (element) => {
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
  };
  const values = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.nodeValue.trim().replace(/\\s+/g, ' ');
    const parent = node.parentElement;
    if (text && /[A-Za-z]/.test(text) && parent && !parent.closest(blocked) && visible(parent)) values.add(text);
  }
  for (const element of document.querySelectorAll('[aria-label],[title],[placeholder]')) {
    if (element.closest(blocked) || !visible(element)) continue;
    for (const name of ['aria-label','title','placeholder']) {
      const text = (element.getAttribute(name) || '').trim().replace(/\\s+/g, ' ');
      if (text && /[A-Za-z]/.test(text)) values.add(text);
    }
  }
  return [...values].sort();
})()`;

function isTranslatableUiCandidate(value) {
  if (/^[0-9]+[mhd]$/i.test(value)) return false;
  if (/[\u3400-\u9fff]/.test(value)) return false;
  if (/^(Gemini|Claude|GPT|DeepSeek)\b/i.test(value)) return false;
  if (/^(gemini|npm|pnpm|node\.js|python|terminal|shell|mcp|api|sdk|cli|json|yaml|markdown|http|https)$/i.test(value)) return false;
  return true;
}

function hasTranslation(value, translations) {
  return Object.hasOwn(translations, value)
    || /^Select model, current:\s*(.+)$/.test(value)
    || /^(\d+)mo$/.test(value);
}

async function main() {
  const port = await discoverDevToolsPort();
  const [translations, targets] = await Promise.all([
    readFile(new URL('../../translations/zh-CN.json', import.meta.url), 'utf8').then(JSON.parse),
    getTargets(port)
  ]);
  const scanned = await Promise.all(targets.map((target) => evaluate(target, expression)));
  const strings = [...new Set(scanned.flat())].filter(isTranslatableUiCandidate).sort((a, b) => a.localeCompare(b));
  const untranslated = strings.filter((value) => !hasTranslation(value, translations));
  const covered = strings.length - untranslated.length;
  const rate = strings.length ? ((covered / strings.length) * 100).toFixed(1) : '0.0';
  const markdown = [
    '# 未翻译 UI 字符串',
    '',
    `扫描时间：${new Date().toISOString()}`,
    `DevTools 端口：${port}`,
    `可见英文 UI：${strings.length}`,
    `已有精确翻译：${covered}`,
    `未翻译：${untranslated.length}`,
    `覆盖率：${rate}%`,
    '',
    '## 待补充',
    '',
    ...(untranslated.length ? untranslated.map((value) => `- \`${value.replace(/`/g, '\\`')}\``) : ['- 未发现待补充项。'])
  ].join('\n') + '\n';
  await writeFile(reportPath, markdown);
  console.log(markdown);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Scan failed: ${error.message}`);
    process.exitCode = 1;
  });
}
