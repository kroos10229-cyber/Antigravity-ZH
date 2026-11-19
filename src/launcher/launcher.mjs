#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { discoverDevToolsPort, injectOnce } from '../injector/injector.mjs';

const appPath = process.env.ANTIGRAVITY_APP_PATH || '/Applications/Antigravity.app';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function launchOfficialApp() {
  // Without -n, macOS foregrounds a running Antigravity instance instead of
  // creating a second, hidden-looking copy. If it is not running, it launches it.
  const child = spawn('open', [appPath, '--args', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0'], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
}

async function main() {
  console.log('Launching official Antigravity…');
  launchOfficialApp();
  let attachedPort;
  let retryDelay = 2_500;
  for (;;) {
    try {
      const port = await discoverDevToolsPort();
      const targets = await injectOnce({ port });
      if (attachedPort !== port) {
        console.log(`Chinese translation layer attached to ${targets.length} renderer(s) through local port ${port}.`);
        attachedPort = port;
      }
      retryDelay = 2_500;
    } catch {
      if (attachedPort !== undefined) {
        console.log('Antigravity renderer disconnected; waiting to reconnect.');
      }
      attachedPort = undefined;
      retryDelay = Math.min(retryDelay * 2, 10_000);
    }
    await wait(retryDelay);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Launcher failed: ${error.message}`);
    process.exitCode = 1;
  });
}
