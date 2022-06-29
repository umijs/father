import { defineConfig } from 'father';

export default defineConfig({
  {{#isBoth}}esm: { input: 'src/client' },
  cjs: { input: 'src/server' },{{/isBoth}}{{#isNode}}cjs: {},{{/isNode}}{{#isBrowser}}esm: {},{{/isBrowser}}
  prebundle: {},
});
