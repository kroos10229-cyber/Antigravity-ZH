#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';

const defaultPort = 9222;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const execFileAsync = promisify(execFile);

async function isAntigravityDevTools(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/version`);
    if (!response.ok) return false;
    const version = await response.json();
    return /Antigravity/i.test(version['User-Agent'] || '') || /Antigravity/i.test(version.Browser || '');
  } catch {
    return false;
  }
}

export async function discoverDevToolsPort() {
  if (process.env.ANTIGRAVITY_ZH_DEBUG_PORT) return Number(process.env.ANTIGRAVITY_ZH_DEBUG_PORT);
  const { stdout } = await execFileAsync('lsof', ['-nP', '-a', '-c', 'Antigravity', '-iTCP', '-sTCP:LISTEN', '-Fn']);
  const candidates = [...stdout.matchAll(/^n.*:(\d+)$/gm)].map((match) => Number(match[1]));
  for (const port of candidates) {
    if (await isAntigravityDevTools(port)) return port;
  }
  throw new Error('Could not discover Antigravity DevTools port; launch Antigravity-ZH and wait for its window');
}

export async function getTargets(port = defaultPort) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!response.ok) throw new Error(`DevTools endpoint returned ${response.status}`);
  const targets = await response.json();
  // Never inject the user's private cache into an OAuth page or web preview.
  return targets.filter((target) => target.type === 'page' && target.webSocketDebuggerUrl
    && target.title === 'Antigravity'
    && /^https?:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?(?:\/|$)/i.test(target.url));
}

export async function evaluate(target, expression) {
  return await new Promise((resolve, reject) => {
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('DevTools evaluation timed out'));
    }, 8_000);
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression, awaitPromise: true, returnByValue: true }
      }));
    });
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== 1) return;
      clearTimeout(timer);
      socket.close();
      if (message.error || message.result?.exceptionDetails) {
        reject(new Error(message.error?.message || message.result.exceptionDetails.text));
      } else {
        resolve(message.result?.result?.value);
      }
    });
    socket.addEventListener('error', (event) => {
      clearTimeout(timer);
      reject(new Error(`DevTools WebSocket failed: ${event.message || 'unknown error'}`));
    });
  });
}

export async function buildTranslatorExpression(root) {
  const localPath = process.env.ANTIGRAVITY_ZH_LOCAL_TRANSLATIONS || join(homedir(), 'Library', 'Application Support', 'Antigravity-ZH', 'local.zh-CN.json');
  const localPromise = readFile(localPath, 'utf8').then(JSON.parse).then((values) => Object.fromEntries(Object.entries(values).filter(([, value]) => typeof value === 'string'))).catch((error) => {
    if (error.code !== 'ENOENT') console.warn('Invalid local translation cache ignored');
    return {};
  });
  const [source, translations, details, reviewed, templates, local] = await Promise.all([
    readFile(new URL('../translator/translate.js', import.meta.url), 'utf8'),
    readFile(new URL('../../translations/zh-CN.json', import.meta.url), 'utf8'),
    readFile(new URL('../../translations/details.zh-CN.json', import.meta.url), 'utf8'),
    readFile(new URL('../../translations/ui-reviewed.zh-CN.json', import.meta.url), 'utf8'),
    readFile(new URL('../../translations/templates.zh-CN.json', import.meta.url), 'utf8'),
    localPromise
  ]);
  const ui = JSON.stringify({...JSON.parse(translations), ...JSON.parse(reviewed)});
  const descriptions = JSON.stringify({...JSON.parse(details), ...local});
  return source.replace(/__ANTIGRAVITY_TRANSLATIONS__|__ANTIGRAVITY_DETAIL_TRANSLATIONS__|__ANTIGRAVITY_TEMPLATES__/g, (marker) => ({__ANTIGRAVITY_TRANSLATIONS__:ui, __ANTIGRAVITY_DETAIL_TRANSLATIONS__:descriptions, __ANTIGRAVITY_TEMPLATES__:templates})[marker]);
}

export async function injectOnce({ port = defaultPort, root = process.cwd() } = {}) {
  const expression = await buildTranslatorExpression(root);
  const fingerprint = createHash('sha256').update(expression).digest('hex');
  const targets = await getTargets(port);
  if (!targets.length) throw new Error('No Electron renderer page is available');
  const results = await Promise.all(targets.map(async (target) => {
    const current = await evaluate(target, 'window.__ANTIGRAVITY_ZH__?.injectionFingerprint');
    if (current === fingerprint) return {url: target.url, result: {installed: true, unchanged: true}};
    const result = await evaluate(target, expression + `\n;window.__ANTIGRAVITY_ZH__.injectionFingerprint=${JSON.stringify(fingerprint)};({installed:true, translated:window.__ANTIGRAVITY_ZH__.translatedCount});`);
    return {url: target.url, result};
  }));
  return results;
}

async function main() {
  const port = await discoverDevToolsPort();
  const results = await injectOnce({ port });
  console.log(JSON.stringify({ port, targets: results }, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Injection failed: ${error.message}`);
    process.exitCode = 1;
  });
}
