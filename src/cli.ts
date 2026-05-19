// src/cli.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('claudebrowser')
  .description('Claude Code browser automation via Chrome CDP')
  .version('1.62.0');

program
  .command('init')
  .description('One-time setup: detect Chrome, select profile, write config')
  .action(async () => {
    const { runInit } = await import('./init');
    await runInit();
  });

program
  .command('serve')
  .description('Start MCP server for Claude Code')
  .option('-s, --session <name>', 'Name this session (e.g. isi-house, client-project)')
  .action(async (opts: { session?: string }) => {
    const { ensureChrome } = await import('./chrome');
    const { startServer } = await import('./server');
    await ensureChrome();
    await startServer(opts.session);
  });

program
  .command('status')
  .description('Check Chrome debug port status')
  .action(async () => {
    const { readConfig } = await import('./config');
    const { isDebugPortOpen } = await import('./chrome');
    const config = readConfig();
    const open = await isDebugPortOpen(config.debugPort);
    console.log(open
      ? `✓ Chrome debug port ${config.debugPort} is open`
      : `✗ Chrome not running on port ${config.debugPort}. Run: claudebrowser serve`
    );
    process.exit(open ? 0 : 1);
  });

program
  .command('auth-check')
  .description('Check login status for configured platforms')
  .action(async () => {
    const { readConfig } = await import('./config');
    const { CdpClient } = await import('./cdp/client');
    const { checkAllAuth, AUTH_PRESETS } = await import('./cdp/auth');

    const config = readConfig();
    const client = new CdpClient(config.debugPort);

    try {
      await client.connect();
    } catch {
      console.log('Chrome not running. Start Chrome first (claudebrowser serve will launch it).');
      process.exit(1);
    }

    const checks = config.authChecks ?? AUTH_PRESETS;
    const results = await checkAllAuth(client, checks);
    await client.disconnect();

    const DIVIDER = '─'.repeat(34);
    console.log('\nAuth Status');
    console.log(DIVIDER);

    let allLoggedIn = true;
    for (const result of results) {
      const icon = result.loggedIn ? '✓' : '✗';
      const label = result.name.padEnd(18);
      const status = result.loggedIn ? 'logged in' : 'logged out';
      const hint = result.loggedIn ? '' : `  ← go to ${result.url} to re-login`;
      console.log(`${icon} ${label} ${status}${hint}`);
      if (!result.loggedIn) allLoggedIn = false;
    }

    console.log('');
    process.exit(allLoggedIn ? 0 : 1);
  });

program
  .command('doctor')
  .description('Diagnose common setup issues')
  .action(async () => {
    const { runDoctor } = await import('./doctor');
    await runDoctor();
  });

program.parse();
