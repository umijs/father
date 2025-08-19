# Upgrading from Father v2 or Father-Build v1

> Note: Father v2 = Father-Build v1 + Documentation Capabilities + Other Engineering Enhancements. In terms of build functionality, they are the same.

Follow these steps to manually upgrade your component library build system from Father v2 or Father-Build v1 to Father 4.

---

## Breaking Changes

1. **All Rollup-based build modes are no longer supported.**  
   - If your project's source code needs bundling, use UMD builds (based on Webpack).  
   - If bundling is not needed, use Bundless mode to output ESModule or CommonJS builds (based on Babel/esbuild).  
   - See the [Build Modes](./build-mode.md) documentation for details.  

2. **CSS Modules are no longer built-in.**  
   - Using CSS Modules in component libraries is discouraged because it makes styles harder to override and adds extra compilation overhead for users.  

3. **Bundless mode no longer compiles non-JavaScript files.**  
   - Stylesheets should be compiled by the consuming project for better flexibility.  
   - If your component library requires custom themes, consider outputting a UMD build.  
   - See [Building UMD Output - When to Choose](./umd.md#when-to-choose).  

4. **Built-in documentation support is removed.**  
   - If you previously used Docz, migrate to dumi following this [migration guide](https://github.com/umijs/father/issues/241).  
   - For new projects, use the [dumi CLI](https://d.umijs.org/guide/initialize) to initialize a React component library.  

5. **Monorepo support is no longer built-in.**  
   - Use Father 4 in combination with your monorepo tooling, such as pnpm workspace.  
   - See [Umi 4's repository](https://github.com/umijs/umi) for an example setup.  

---

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

---

## Configuration File Upgrade

- Switch from `.fatherrc.js` to `.fatherrc.ts`** for better autocomplete support.  
- Update configurations accordingly:

```diff
+ import { defineConfig } from 'father';

- export default {
+ export default defineConfig({
    ...
- }
+ });
```

---

## Deprecated Configuration Options

The following options have been removed:

```diff
export default defineConfig({
  cjs: {
    # No longer needed in Bundless mode
-   file: 'xxx',
    # No longer supported
-   lazy: true,
    # Bundless mode does not minify
-   minify: true,
  },
  esm: {
    # No longer needed in Bundless mode
-   file: 'xxx',
    # Future pure ESM solution will be provided
-   mjs: true,
    # Bundless mode does not minify
-   minify: true,
  },
  umd: {
    # Automatically uses the entry filename, use `chainWebpack` for custom needs
-   file: 'xxx',
    # Always generates minified version
-   minFile: true,
  },
  # No longer supported
- cssModules: true,
  # Type checking cannot be disabled
- disableTypeCheck: true,
  # Migrate to dumi
- doc: {},
  # No longer supported
- file: 'xxx',
  # Bundless mode does not compile non-JS files
- lessInBabelMode: {},
  # Now automatic based on dependencies
- runtimeHelpers: true,
  # For UMD builds, use `umd: { extractCSS: boolean }` (default: `true`)
- extractCSS: true,
  # Duplicate functionality with extractCSS
- injectCSS: true,
  # Monorepo support is no longer relevant
- pkgFilter: {},
- pkgs: [],
  # Rollup-specific options are not supported
- extraRollupPlugins: [],
- include: {},
- lessInRollupMode: {},
- nodeResolveOpts: {},
- sassInRollupMode: {},
});
```

---

## Updated Configuration Options

Some configurations require changes:

```diff
export default defineConfig({
  // String values are no longer supported, use an object instead
- esm: 'babel',
  esm: {
    # Replace with alias: { 'antd/lib': 'antd/es' }
-   importLibToEs: true,
    # Use the transformer option instead (see config docs)
-   type: 'rollup',
    # Default output is dist/esm; specify if needed
+   output: 'es'
  },
  // String values are no longer supported, use an object instead
- cjs: 'babel',
  cjs: {
    # Use transformer option instead (see config docs)
-   type: 'rollup',
    # Default is `node`; set `browser` if needed
+   platform: 'browser',
    # Default output is dist/cjs; specify if needed
+   output: 'lib'
  },
  umd: {
    # Use `externals` instead
-   globals: {},
    # Default output is dist/umd; specify if needed
+   output: 'dist'
  },
  # For UMD builds, use `umd: { autoprefixer: {} }`
- autoprefixer: {},
  # For UMD builds, use `umd: { entry: 'xxx' }`
- entry: 'xxx',
  # For UMD builds, use `umd: { postcssOptions: { plugins: [] } }`
- extraPostCSSPlugins: []
  # For UMD builds, use `umd: { entry: { 'src/xx': {} } }`
- overridesByEntry: {},
  # Use `targets` instead
- nodeVersion: 14,
  # Use `platform` instead
- target: 'node',
  # Use `esm/cjs: { overrides: {}, ignores: [] }` instead
- browserFiles: [],
- nodeFiles: [],
  # For UMD builds, use `umd: { externals: {} }`
- externalsExclude: {},
- extraExternals: {},
  # Use `define` instead
- inject: {},
- replace: {},
});
```

---

## Other Feature Upgrades

### `test`

- **No longer built-in.**  
- Use `father g jest` to generate test configuration.

### `precommit`

- No longer built-in. 
- Use `father g lint`, `father g commitlint`, etc., to generate necessary pre-commit scripts.

---

## Upgrade Verification

 If using Babel mode before:
1. Copy the old build output from `node_modules` into your project.
2. Commit this temporary snapshot using `git commit`.
3. Run `father build` with the new configuration.
4. Compare the new output using `git diff`.  
   - If no logical differences exist, the upgrade is successful.
   - Changes in Babel helpers imports are expected and normal.  
5. Reset the temporary commit.

 If using Rollup mode before (including UMD builds):
1. Run `father build` with the new configuration.
2. Validate output functionality by testing it in a real project.
   - See [Debugging in a Project](./dev.md#debugging-in-a-project).
3. If everything works as expected, the upgrade is complete!

---

Congratulations! 🎉 You've successfully upgraded to Father 4!