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

The traditional `module` field is intended for bundlers and does not guarantee that Node.js can load its paths directly. Father can complete ESM specifiers, align declarations, and generate an ESM package marker:

```ts
// .fatherrc.ts
export default {
  esm: {
    output: 'es',
    platform: 'node',
    fullySpecified: true,
    outputPackageType: 'module',
  },
  cjs: { output: 'lib' },
};
```

Declare separate runtime and type entry points in `package.json`:

```json
{
  "main": "./lib/index.js",
  "module": "./es/index.js",
  "types": "./lib/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./es/index.d.ts",
        "default": "./es/index.js"
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

Configure these options explicitly: `exports.import` declares consumer entry points and does not enable build options. TypeScript projects also need `declaration` enabled in `tsconfig.json`. Publish the generated `es/package.json`. Keep the root package in CommonJS mode so `.js` and `.d.ts` files in `lib` are interpreted as CommonJS.

`fullySpecified` changes `export * from './utils'` to `export * from './utils.js'` or `export * from './utils/index.js'`, depending on the actual output, and aligns declaration specifiers. `outputPackageType` controls package markers independently; omit it when the package type is already set correctly. Neither option changes output filenames.

External dependency paths are preserved by default. For legacy subpaths such as `dayjs/plugin/weekday` in packages without `exports`, enable `esm.resolveDepSubpath: true` separately. Dependencies with `exports` always keep their public specifiers.

Existing `esm: {}` builds retain their behavior: all these options are disabled by default. Father already preserves ESM syntax, and its output can run directly in Node.js when source paths and package types meet Node.js requirements. These options automate path completion and package markers; your code and dependencies must still support Node.js.

In the Father project, both ESModule and CommonJS outputs are built using the Bundless mode. For details on Bundless mode, see [Build Modes - Bundless](./build-mode.md#bundless).
