export const MIN_NODE_VERSION = 14;
export const DEFAULT_CONFIG_FILES = ['.fatherrc.ts', '.fatherrc.js'];
export const FRAMEWORK_NAME = 'father';
export const WATCH_DEBOUNCE_STEP = 300;
export const DEV_COMMAND = 'dev';
export const BUILD_COMMANDS = ['build', 'prebundle'];
export const DEBUG_BUNDLESS_NAME = 'father:bundless';
export const CACHE_PATH = 'node_modules/.cache/father';
export const DEFAULT_BUNDLESS_IGNORES = [
  '**/*.md',
  '**/*.d.ts',
  '**/fixtures/**',
  '**/__{test,tests,snapshots}__/**',
  '**/*.{test,e2e,spec}.{js,jsx,ts,tsx}',
];
