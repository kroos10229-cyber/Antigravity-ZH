#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const appPath = process.env.ANTIGRAVITY_APP_PATH || '/Applications/Antigravity.app';
const asarPath = `${appPath}/Contents/Resources/app.asar`;
const outputPath = new URL('../../supported-version.json', import.meta.url);

async function main() {
  const version = execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleShortVersionString', `${appPath}/Contents/Info.plist`], { encoding: 'utf8' }).trim();
  const digest = createHash('sha256').update(await readFile(asarPath)).digest('hex');
  const result = { current: version, appPath, appAsarSha256: digest, checkedAt: new Date().toISOString() };
  if (process.argv.includes('--write')) {
    const prior = await readFile(outputPath, 'utf8').then(JSON.parse).catch(() => ({ tested: [] }));
    const tested = [...new Set([...(prior.tested || []), version])];
    await writeFile(outputPath, JSON.stringify({ tested, ...result }, null, 2) + '\n');
  }
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Version check failed: ${error.message}`);
    process.exitCode = 1;
  });
}
