#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { discoverDevToolsPort, injectOnce } from '../injector/injector.mjs';

const appPath = process.env.ANTIGRAVITY_APP_PATH || '/Applications/Antigravity.app';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function launchOfficialApp() {
  // Without -n, macOS foregrounds a running Antigravity instance instead of
  // creating a second, hidden-looking copy. If it is not running, it launches it.
  const child = spawn('open', [appPath], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
}

async function main() {
  console.log('Launching official Antigravity…');
  launchOfficialApp();
  let announced = false;
  let failedChecksAfterAttach = 0;
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      const port = await discoverDevToolsPort();
      const targets = await injectOnce({ port });
      if (!announced) {
        console.log(`Chinese translation layer attached to ${targets.length} renderer(s) through local port ${port}.`);
        announced = true;
      }
      failedChecksAfterAttach = 0;
    } catch (error) {
      if (announced) {
        failedChecksAfterAttach++;
        // Once the official renderer has disappeared for several checks, exit.
        // This lets macOS run this launcher again on the next double-click.
        if (failedChecksAfterAttach >= 4) {
          console.log('Antigravity closed; Antigravity-ZH launcher is exiting.');
          return;
        }
      } else if (Date.now() > deadline) {
        console.error(`Could not attach to Antigravity: ${error.message}`);
        return;
      }
    }
    await wait(2_500);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Launcher failed: ${error.message}`);
    process.exitCode = 1;
  });
}
