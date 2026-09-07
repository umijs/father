# Building ESModule and CommonJS Outputs

> In the Father project, ESModule and CommonJS output builds follow a similar process, so they are covered together in this chapter.

## How to Choose

Node.js supports both ESModule and CommonJS, while browsers and frontend bundlers primarily use ESModule. Choose the output format according to your consumers:

| Output Type / Runtime | Browser        | Node.js        | Both           |
| --------------------- | -------------- | -------------- | -------------- |
| ESModule              | ✅ Recommended | ✅ Supported   | ✅ Recommended |
| CommonJS              | Not Necessary  | ✅ Recommended | ✅ Recommended |

Additional Notes

1. When publishing ESModule for Node.js, use the native ESM configuration below. To support CommonJS consumers too, generate CJS output and select the entry points with conditional exports.
2. For browser environments, CommonJS output is unnecessary since all modern module bundlers can handle ESModules. With the rise of tools like Vite that support native ESModules, using ESModule is the best future-proof approach.
3. Both means the output is intended for use in both browser and Node.js environments, such as `react-dom` and `umi`.

## How to Build

Use the `esm` and `cjs` configuration options, then run `father build` to generate ESModule and CommonJS outputs:

```js
// .fatherrc.js
export default {
  // Default values for the `esm` config (only override if needed)
  esm: {
    input: 'src', // Default compilation directory
    platform: 'browser', // Outputs for browser environments by default
    transformer: 'babel', // Uses Babel for better compatibility
  },
  // Default values for the `cjs` config (only override if needed)
  cjs: {
    input: 'src', // Default compilation directory
    platform: 'node', // Outputs for Node.js environments by default
    transformer: 'esbuild', // Uses esbuild for faster build speeds
  },
};
```

For more configuration options, refer to the [Configuration Guide](../config.md).

## Native ESM in Node.js

The traditional `module` field is intended for bundlers and does not guarantee that Node.js can load its paths directly. Father can choose output extensions according to package types and align module references and declarations:

```ts
// .fatherrc.ts
export default {
  esm: {
    output: 'es',
    platform: 'node',
    autoExtension: true,
  },
  cjs: { output: 'lib', autoExtension: true },
};
```

Declare separate runtime and type entry points in `package.json`:

```json
{
  "type": "commonjs",
  "main": "./lib/index.js",
  "module": "./es/index.mjs",
  "types": "./lib/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./es/index.d.mts",
        "default": "./es/index.mjs"
      },
      "require": {
        "types": "./lib/index.d.ts",
        "default": "./lib/index.js"
      }
    }
  },
  "files": ["es", "lib"]
}
```

This example explicitly uses a CommonJS root package, producing `.mjs` / `.d.mts` for ESM and `.js` / `.d.ts` for CJS. With `"type": "module"`, these become `.js` / `.d.ts` and `.cjs` / `.d.cts` respectively; update the published entry points accordingly. Father does not generate additional package.json files or modify root package metadata.

Enable `autoExtension` explicitly; `exports.import` only declares consumer entry points. TypeScript projects also need `declaration` enabled in `tsconfig.json`. Relative imports, re-exports, dynamic imports and CJS `require()` references follow actual output files by default, as do declaration references. Control them independently with `redirect.js.extension` and `redirect.dts.extension`.

External dependency paths are preserved by default. For legacy subpaths such as `dayjs/plugin/weekday` in packages without `exports`, enable `esm.resolveDepSubpath: true` separately. Dependencies with `exports` retain their public specifiers.

Existing `esm: {}` / `cjs: {}` builds retain their behavior. Father already preserves ESM syntax, and its output can run directly in Node.js when source paths and package types meet Node.js requirements. The new options automate output extensions and references; your code and dependencies must still support Node.js.

In the Father project, both ESModule and CommonJS outputs are built using the Bundless mode. For details on Bundless mode, see [Build Modes - Bundless](./build-mode.md#bundless).
