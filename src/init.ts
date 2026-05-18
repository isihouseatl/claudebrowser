// src/init.ts
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import * as readline from 'readline/promises';
import { writeConfig, DEFAULT_CONFIG } from './config';
import { isDebugPortOpen } from './chrome';

function findChromeProfiles(): Array<{ name: string; path: string; account: string }> {
  const chromeDir = join(homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
  if (!existsSync(chromeDir)) return [];

  return readdirSync(chromeDir)
    .filter(e => e === 'Default' || e.startsWith('Profile'))
    .filter(e => existsSync(join(chromeDir, e, 'Preferences')))
    .map(e => {
      try {
        const prefs = JSON.parse(readFileSync(join(chromeDir, e, 'Preferences'), 'utf-8'));
        return {
          name: prefs?.profile?.name ?? e,
          path: join(chromeDir, e),
          account: prefs?.account_info?.[0]?.email ?? 'Unknown',
        };
      } catch {
        return { name: e, path: join(chromeDir, e), account: 'Unknown' };
      }
    });
}

export async function runInit(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('\nclaudebrowser init\n');

  const defaultChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (!existsSync(defaultChromePath)) {
    console.error('Chrome not found. Install Google Chrome and retry.');
    rl.close();
    process.exit(1);
  }
  console.log('Checking for Chrome...       ✓ Found');

  let profilePath = join(homedir(), '.claudebrowser', 'chrome-profile');
  const profiles = findChromeProfiles();

  if (profiles.length > 0) {
    console.log('\nChrome profiles found:');
    profiles.forEach((p, i) => console.log(`  ${i + 1}. ${p.name} (${p.account})`));
    console.log(`  ${profiles.length + 1}. New dedicated profile (recommended)`);
    const answer = await rl.question('\nChoose a profile: ');
    const idx = parseInt(answer.trim()) - 1;
    if (idx >= 0 && idx < profiles.length) profilePath = profiles[idx].path;
  }

  const portAnswer = await rl.question('\nDebug port [9222]: ');
  const debugPort = parseInt(portAnswer.trim() || '9222');

  process.stdout.write('\nTesting CDP connection...    ');
  const open = await isDebugPortOpen(debugPort);
  console.log(open ? '✓ Chrome already running' : '✓ Port free (Chrome launched on serve)');

  writeConfig({ ...DEFAULT_CONFIG, chromePath: defaultChromePath, debugPort, profilePath });
  console.log('Writing config...            ✓ ~/.claudebrowser/config.json\n');

  console.log('Add to ~/.claude/settings.json:\n');
  console.log(JSON.stringify({ mcpServers: { browser: { command: 'claudebrowser', args: ['serve'] } } }, null, 2));
  console.log('\nDone.\n');

  rl.close();
}
