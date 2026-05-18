// src/cli.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('claudebrowser')
  .description('Claude Code browser automation via Chrome CDP')
  .version('1.0.0');

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
  .action(async () => {
    const { ensureChrome } = await import('./chrome');
    const { startServer } = await import('./server');
    await ensureChrome();
    await startServer();
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

program.parse();
