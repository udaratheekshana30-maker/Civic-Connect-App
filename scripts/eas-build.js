// Runs `eas build` for Android with this folder as the project root.
// Needed because the surrounding git repository is the whole user folder:
// without EAS_PROJECT_ROOT, EAS would try to package everything in it.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const profile = process.argv[2] || 'preview';
const root = path.resolve(__dirname, '..');
const result = spawnSync('npx', ['eas-cli@latest', 'build', '-p', 'android', '--profile', profile, '--no-wait'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, EAS_NO_VCS: '1', EAS_PROJECT_ROOT: root },
});
process.exit(result.status ?? 1);
