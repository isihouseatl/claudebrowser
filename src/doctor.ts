// src/doctor.ts
import { existsSync } from 'fs';
import { readConfig, configExists } from './config';
import { isDebugPortOpen } from './chrome';
import { CdpClient } from './cdp/client';

const DIVIDER = '─'.repeat(40);
const LABEL_WIDTH = 20;

function printCheck(label: string, passed: boolean, detail: string, fix?: string): void {
  const icon = passed ? '✓' : '✗';
  const paddedLabel = label.padEnd(LABEL_WIDTH);
  console.log(`  ${paddedLabel} ${icon} ${detail}`);
  if (!passed && fix) {
    const indent = ' '.repeat(LABEL_WIDTH + 5);
    console.log(`${indent}Fix: ${fix}`);
  }
}

function printSkipped(label: string, reason: string): void {
  const paddedLabel = label.padEnd(LABEL_WIDTH);
  console.log(`  ${paddedLabel} - Skipped (${reason})`);
}

export async function runDoctor(): Promise<void> {
  console.log('\nclaudebrowser doctor');
  console.log(DIVIDER);
  console.log('');

  const config = readConfig();
  let allPassed = true;

  // 1. Chrome binary
  const chromeBinaryOk = existsSync(config.chromePath);
  printCheck(
    'Chrome binary',
    chromeBinaryOk,
    chromeBinaryOk ? config.chromePath : config.chromePath,
    chromeBinaryOk ? undefined : `Install Google Chrome at ${config.chromePath}`
  );
  if (!chromeBinaryOk) allPassed = false;

  // 2. Config file
  const configOk = configExists();
  printCheck(
    'Config file',
    configOk,
    configOk ? '~/.claudebrowser/config.json' : '~/.claudebrowser/config.json not found',
    configOk ? undefined : 'Run claudebrowser init'
  );
  if (!configOk) allPassed = false;

  // 3. Chrome profile
  const profileOk = existsSync(config.profilePath);
  printCheck(
    'Chrome profile',
    profileOk,
    profileOk ? config.profilePath : config.profilePath + ' not found',
    profileOk ? undefined : 'Run claudebrowser init to create or select a profile'
  );
  if (!profileOk) allPassed = false;

  // 4. Debug port
  const portOpen = await isDebugPortOpen(config.debugPort);
  printCheck(
    `Debug port (${config.debugPort})`,
    portOpen,
    portOpen ? 'Chrome is running and reachable' : 'Chrome is not running',
    portOpen ? undefined : `Run claudebrowser serve — it will launch Chrome automatically`
  );
  if (!portOpen) allPassed = false;

  // 5. CDP connection
  if (!portOpen) {
    printSkipped('CDP connection', 'Chrome not running');
  } else {
    const client = new CdpClient(config.debugPort);
    try {
      await client.connect();
      let versionDetail = 'Connected';
      try {
        const versionInfo = await client.raw.Browser.getVersion();
        versionDetail = `Connected — ${versionInfo.product}`;
      } catch {
        // version info is best-effort
      }
      await client.disconnect();
      printCheck('CDP connection', true, versionDetail);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      printCheck(
        'CDP connection',
        false,
        `Failed: ${message}`,
        `Chrome is running but not accepting CDP connections — check if another process owns port ${config.debugPort}`
      );
      allPassed = false;
    }
  }

  console.log('');
  console.log(DIVIDER);

  if (allPassed) {
    console.log('All checks passed.');
  } else {
    console.log('One or more checks failed. See fixes above.');
  }

  console.log('');
  process.exit(allPassed ? 0 : 1);
}
