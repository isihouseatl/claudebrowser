// build.mjs
import { build } from 'esbuild';
import { spawnSync } from 'child_process';
import { writeFileSync, renameSync } from 'fs';

// Bundle TypeScript output into a single CommonJS file
await build({
  entryPoints: ['dist/cli.js'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/bundle.cjs',
  format: 'cjs',
  external: ['fsevents', 'readline/promises'],
});

// Write pkg config
writeFileSync('pkg.json', JSON.stringify({
  pkg: {
    scripts: 'dist/bundle.cjs',
    targets: ['node20-macos-arm64', 'node20-macos-x64'],
    outputPath: 'releases/',
  },
}, null, 2));

// Use @yao-pkg/pkg (supports node20) with --no-bytecode --no-signature to
// avoid the fabricator codesign issues on macOS with Node 24.
// Build standalone binaries — array args, no shell interpolation.
const pkgBin = 'node_modules/@yao-pkg/pkg/lib-es5/bin.js';

let result = spawnSync(
  process.execPath,
  [
    pkgBin, 'dist/bundle.cjs',
    '--config', 'pkg.json',
    '--out-path', 'releases/',
    '--no-bytecode',
    '--public',
    '--no-signature',
  ],
  { stdio: 'inherit' }
);

if (result.status !== 0) {
  process.stderr.write('pkg node20 targets unavailable, retrying with node18\n');
  result = spawnSync(
    process.execPath,
    [
      pkgBin, 'dist/bundle.cjs',
      '--targets', 'node18-macos-arm64,node18-macos-x64',
      '--out-path', 'releases/',
      '--no-bytecode',
      '--public',
      '--no-signature',
    ],
    { stdio: 'inherit' }
  );
}

if (result.status !== 0) {
  process.stderr.write('pkg build failed\n');
  process.exit(result.status ?? 1);
}

// pkg names output after the input filename — rename to canonical names
const rename = (from, to) => {
  try { renameSync(from, to); } catch (_) { /* already correct name */ }
};
rename('releases/bundle-arm64', 'releases/claudebrowser-macos-arm64');
rename('releases/bundle-x64',   'releases/claudebrowser-macos-x64');

console.log('\nBuild complete:');
console.log('  releases/claudebrowser-macos-arm64');
console.log('  releases/claudebrowser-macos-x64');
