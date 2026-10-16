// Publishes a JS-only update (no reinstall needed) to installed preview APKs.
// Usage: npm run update -- "what changed"
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const message = process.argv.slice(2).join(' ') || 'Update';
const root = path.resolve(__dirname, '..');
const result = spawnSync(
  'npx',
  ['eas-cli@latest', 'update', '--channel', 'preview', '--environment', 'preview', '--platform', 'android', '--message', JSON.stringify(message), '--non-interactive'],
  { cwd: root, stdio: 'inherit', shell: true, env: { ...process.env, EAS_NO_VCS: '1', EAS_PROJECT_ROOT: root } },
);
process.exit(result.status ?? 1);
