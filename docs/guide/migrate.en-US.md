# Upgrade from Father v2 or Father-Build v1  

> Note: Father v2 = Father-Build v1 + documentation capabilities + other engineering enhancements. The build functionality remains the same.  

Follow these steps to manually upgrade your component library from Father v2 or Father-Build v1 to Father 4.  

## Breaking Changes  

1. **Rollup build mode is no longer supported.**  
   - If your source code needs bundling, output a UMD build (Webpack-based).  
   - If bundling is unnecessary, output ESModule (ESM) or CommonJS (CJS) using Bundless mode (Babel/esbuild-based).  
   - See [Build Modes](./build-mode.md) for details.  

2. **CSS Modules are no longer supported.**  
   - Using CSS Modules in a component library makes styles difficult to override and adds compilation overhead to user projects.  

3. **Bundless mode no longer compiles non-JavaScript files.**  
   - Let actual projects handle stylesheet compilation for better flexibility.  
   - If your component library requires custom themes, consider outputting a UMD build instead. See [UMD Build - How to Choose](./umd.md#how-to-choose).  

4. **Built-in documentation solutions are removed.**  
   - If you used **Docz**, migrate to Dumi ([Migration Guide](https://github.com/umijs/father/issues/241)).  
   - New projects should use the [Dumi Component Development Scaffold](https://d.umijs.org/zh-CN/guide#%E8%84%9A%E6%89%8B%E6%9E%B6%E5%88%9D%E5%A7%8B%E5%8C%96).  
   - Future versions of Dumi 2 and Father 4 will provide an integrated component development solution.  

5. **Monorepo support is no longer built-in.**  
   - Use Father 4 with your monorepo's own setup.  
   - Example: pnpm workspace users can refer to [Umi 4’s repository](https://github.com/umijs/umi).  

## `package.json` Upgrade  

```diff
{
  "scripts": {
+   "dev": "father dev",
    "build": "father build",
    ...
  },
  "devDependencies": {
    ...
-   "father": "^2.0.0"
+   "father": "^4.0.0"
  }
}
```  

## Configuration File Upgrade  

- Switch from `.fatherrc.js` to `.fatherrc.ts` for better auto-completion.  
- Update configurations accordingly:  

```diff
+ import { defineConfig } from 'father';

- export default {
+ export default defineConfig({
    ...
- }
+ });
```  

### Deprecated Configurations  

```diff
export default defineConfig({
  cjs: {
    # Removed - Bundless mode does not need output files
-   file: 'xxx',
    # Removed - No longer configurable
-   lazy: true,
    # Removed - Bundless mode does not minify
-   minify: true,
  },
  esm: {
    # Removed - Bundless mode does not need output files
-   file: 'xxx',
    # Removed - Will be replaced with a simpler pure ESM solution
-   mjs: true,
    # Removed - Bundless mode does not minify
-   minify: true,
  },
  umd: {
    # Removed - Automatically reuses entry filename; use chainWebpack if needed
-   file: 'xxx',
    # Removed - Generates a minified version by default
-   minFile: true,
    # Temporarily unsupported; use chainWebpack if needed
-   sourcemap: true,
  },
  # Removed - No longer configurable
- cssModules: true,
  # Removed - Type checking is always enabled
- disableTypeCheck: true,
  # Removed - Migrate to Dumi
- doc: {},
  # Removed - No longer configurable
- file: 'xxx',
  # Removed - Bundless mode no longer compiles non-JavaScript files
- lessInBabelMode: {},
  # Removed - Defaults to Node.js v14 compatibility
- nodeVersion: 14,
  # Removed - Now automatic if @babel/runtime is in dependencies
- runtimeHelpers: true,
  # Removed - Extracting CSS is now default; use chainWebpack for exceptions
- extractCSS: true,
- injectCSS: true,
  # Removed - Monorepo is no longer handled
- pkgFilter: {},
- pkgs: [],
  # Removed - Rollup-specific configurations are unsupported
- extraRollupPlugins: [],
- include: {},
- lessInRollupMode: {},
- nodeResolveOpts: {},
- sassInRollupMode: {},
});
```  

### Updated Configurations  

```diff
export default defineConfig({
  // String values are no longer supported; use an object instead
- esm: 'babel',
  esm: {
    # Replaced with alias: { 'antd/lib': 'antd/es' }
-   importLibToEs: true,
    # Use the transformer property instead (see docs)
-   type: 'rollup',
    # Default is dist/esm; specify output if needed
+   output: 'es'
  },
  // String values are no longer supported; use an object instead
- cjs: 'babel',
  cjs: {
    # Use the transformer property instead (see docs)
-   type: 'rollup',
    # Default output is node; set to browser if needed
+   platform: 'browser',
    # Default is dist/cjs; specify output if needed
+   output: 'lib'
  },
  umd: {
    # Replaced with externals property
-   globals: {},
    # Default is dist/umd; specify output if needed
+   output: 'dist'
  },
  # UMD-only - Move to umd: { autoprefixer: {} }
- autoprefixer: {},
  # UMD-only - Move to umd: { entry: 'xxx' }
- entry: 'xxx',
  # UMD-only - Move to umd: { postcssOptions: { plugins: [] } }
- extraPostCSSPlugins: []
  # UMD-only - Move to umd: { entry: { 'src/xx': {} } }
- overridesByEntry: {},
  # Replaced with platform property
- target: 'node',
  # Use esm/cjs: { overrides: {}, ignores: [] } instead
- browserFiles: [],
- nodeFiles: [],
  # UMD-only - Move to umd: { externals: {} }
- externalsExclude: {},
- extraExternals: {},
  # Replaced with define property
- inject: {},
- replace: {},
});
```  

## Other Feature Updates  

### Testing  

- **Built-in test support is removed.**  
- Use `father g jest` to generate test configurations.  

### Pre-Commit Hooks  

- **No longer included by default.**  
- Use `father g lint`, `father g commitlint`, etc., to generate pre-commit scripts.  
 

1. Copy old build artifacts from `node_modules` into your project.  
2. Commit them as a temporary Git snapshot.  
3. Run `father build` with the new configuration and ensure it compiles successfully.  
4. Use `git diff` to compare old vs. new artifacts.  
   - If no logical differences (except Babel helper imports), the upgrade is successful.  
5. Reset the temporary commit.  

### If using Rollup mode before upgrade:  

1. Run `father build` with the new configuration and ensure successful compilation.  
2. Validate artifacts using a test project:  
   - Follow [Debugging in a Project](./dev.md#debugging-in-a-project).  
   - If the functionality remains intact, the upgrade is complete.  

Congratulations! 🎉  

You've successfully upgraded to Father 4! 🚀
