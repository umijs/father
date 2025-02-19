# Project Inspection  

Father's project inspection feature helps identify potential issues and provides improvement suggestions. Simply run:  

```bash
$ father doctor
```  

The following rules are currently included.  

## PACK_FILES_MISSING  

- Severity: Error ❌  
- Description:  

The `files` field is configured in `package.json`, but the build output directory is missing. This can cause the published NPM package to lack the necessary modules.  

## EFFECTS_IN_SIDE_EFFECTS  

- Severity: Error ❌  
- Description:  

The `sideEffects` field in `package.json` is misconfigured. Common mistakes include:  

1. The build output includes style files, but `sideEffects` is set to `false`, causing styles to be lost after project compilation.  
2. Using Rollup.js-incompatible patterns like `*.css`. In Webpack, this matches all CSS files, but in Rollup.js, it only matches top-level CSS files.  

## PHANTOM_DEPS  

- Severity: Error ❌  
- Description:  

A dependency is used in the source code but is not declared in `dependencies`. This results in a [phantom dependency](https://rushjs.io/pages/advanced/phantom_deps/)—it may not exist or could be the wrong version, leading to runtime failures.  

## CASE_SENSITIVE_PATHS  

- Severity: Error ❌  
- Description:  

The file path casing in imports does not match the actual file names on disk. This issue is often unnoticed on case-insensitive file systems (e.g., Windows, macOS default settings), but it can cause module resolution failures on case-sensitive systems after publishing to NPM.  

## TSCONFIG_RISK  

- Severity: Error ❌  
- Description:  

Checks for risks in `tsconfig.json`. Currently, the following risk is detected:  

1. If `compilerOptions.declaration` is enabled and `include` does not cover any Bundless build source files, `.d.ts` files may be missing in the output, triggering an error.  

## PREFER_PACK_FILES  

- Severity: Warning ⚠️  
- Description:  

It is recommended to use the `files` field to specify which files to publish to NPM, reducing package size.  

## PREFER_NO_CSS_MODULES  

- Severity: Warning ⚠️  
- Description:  

Avoid using CSS Modules, as they make it difficult for users to override styles and add extra compilation overhead.  

## PREFER_BABEL_RUNTIME  

- Severity: Warning ⚠️  
- Description:  

Installing `@babel/runtime` in `dependencies` is recommended to reduce the build output size.  

> Note: This rule only applies when `transformer` is `babel` and `platform` is `browser`.  

## DUP_IN_PEER_DEPS  

- Severity: Warning ⚠️  
- Description:  

The same dependency appears in both `peerDependencies` and `dependencies`. It is recommended to remove one based on the project's needs.  

If you have additional recommendations for NPM package development, feel free to comment on [this issue](https://github.com/umijs/father-next/issues/36). If approved, the rule will be added.  

## PREFER_PEER_DEPS  

- Severity: Warning ⚠️  
- Description:  

Dependencies that could cause multiple instances (e.g., `react`, `antd`) should be placed in `peerDependencies` instead of `dependencies`.  