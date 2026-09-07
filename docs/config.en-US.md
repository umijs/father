# Config

Father supports the following configuration options.

## General Configuration

### **alias**

- **Type**: `Record<string, string>`
- **Default**: `undefined`
- Specifies aliases to be handled during source code compilation/transformation.
- In **Bundle mode**, `.js` and `.d.ts` output files will automatically convert local path aliases to relative paths.

### **define**

- **Type**: `Record<string, string>`
- **Default**: `undefined`
- Specifies variables to be replaced during compilation/transformation, similar to **Webpack DefinePlugin**.

### **extends**

- **Type**: `string`
- **Default**: `undefined`
- Specifies the path to the parent configuration file.

### **dts**

- **Type**: `{ compiler?: "tsc" | "tsgo" }`
- **Default**: `{ compiler: "tsc" }`
- Configures TypeScript declaration generation. Father uses the built-in TypeScript Compiler API by default. Set `compiler` to `"tsgo"` to generate `.d.ts` files with the TypeScript 7 native compiler or the legacy tsgo preview.

#### **Using the native TypeScript compiler**

Setting `compiler` to `"tsgo"` uses the [TypeScript 7 native compiler](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) to generate declaration files. It keeps type checking while improving declaration generation performance. The `tsgo` configuration name is preserved for compatibility with projects that already enabled this mode.

1. Install TypeScript 7 as a development dependency:

```bash
pnpm add typescript@^7 -D
```

If tools in the project still need the TypeScript Compiler API, install TypeScript 7 side-by-side with the TypeScript 6 compatibility package using the [aliases recommended by the TypeScript team](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0):

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

> TypeScript 7 requires Node.js 16.20.0 or higher. Father recognizes both a direct `typescript@7` dependency and the official `@typescript/native` alias. It also continues to recognize `@typescript/native-preview` for projects that have not migrated yet.

2. Enable native declaration generation in the Father config:

```ts
export default {
  esm: {
    dts: {
      compiler: 'tsgo',
    },
  },
};
```

> **Note**: Father prefers `typescript@7`, then the `@typescript/native` alias, and finally falls back to `@typescript/native-preview`. To avoid installing native binaries for every user, Father only checks these dependencies when `compiler: 'tsgo'` is enabled.

### **extraBabelPlugins**

- **Type**: `string[]`
- **Default**: `undefined`
- Specifies additional **Babel plugins** to be applied.

> **Note**: In **Bundless mode**, if the `transformer` is set to `esbuild` or `swc`, this configuration does not take effect.

### **extraBabelPresets**

- **Type**: `string[]`
- **Default**: `undefined`
- Specifies additional **Babel presets** to be applied.

> **Note**: This is also **not effective in Bundless mode** if `transformer` is `esbuild` or `swc`.

### **platform**

- **Type**: `"browser" | "node"`
- **Default**: `<auto>`
- Specifies the **target platform** for the build output.
  - **esm & umd**: Default is `"browser"`.
  - **cjs**: Default is `"node"`.
  - If set to `"browser"`, output is compatible with **IE11**.
  - If set to `"node"`, output is compatible with **Node.js v14**.

> **Note**:
>
> - In **Bundless mode**, if `transformer` is `esbuild`, the **browser compatibility defaults to Chrome 51** instead of IE11.

### **sourcemap**

- **Type**: `boolean`
- **Default**: `false`
- Enables **source maps** for JavaScript build output.

> **Note**: In **Bundless mode**, the `map` object’s `file` field is empty.

### **targets**

- **Type**: `Record<string, number>`
- **Default**: `<auto>`
- Specifies the compatibility target for compiled output.

| Platform | Transformer | Default Target   |
| -------- | ----------- | ---------------- |
| browser  | babel       | `{ ie: 11 }`     |
| browser  | esbuild     | `{ chrome: 51 }` |
| browser  | swc         | `{ ie: 11 }`     |
| node     | babel       | `{ node: 14 }`   |
| node     | esbuild     | `{ node: 14 }`   |
| node     | swc         | `{ node: 14 }`   |

---

## **Build Configuration**

Father provides build configurations based on **output types**:

- **Bundless mode** → **ESModule (esm), CommonJS (cjs)**
- **Bundle mode** → **UMD, Prebundle**

---

## **Bundless Mode (ESM & CJS)**

### **esm / cjs**

- **Type**: `object`
- **Default**: `undefined`
- Configures **source code transformation** into **ESModule** or **CommonJS** format.
- Supports overriding **general configurations**.

### **input**

- **Type**: `string`
- **Default**: `"src"`
- Specifies the **source directory** to transform.

### **output**

- **Type**: `string`
- **Default**: `<auto>`
- Specifies the **output directory**.
  - **ESM** → Default is `dist/esm`
  - **CJS** → Default is `dist/cjs`

### **autoExtension**

- **Type**: `boolean`
- **Default**: `false`
- Supports `esm`, `cjs` and `overrides`

Chooses JavaScript extensions according to the package type and output format, and matches generated or copied declaration extensions:

| Package type                 | ESM output        | CJS output        |
| ---------------------------- | ----------------- | ----------------- |
| `type: "module"`             | `.js` / `.d.ts`   | `.cjs` / `.d.cts` |
| `type: "commonjs"` or absent | `.mjs` / `.d.mts` | `.js` / `.d.ts`   |

The filename policy follows [Rslib's autoExtension](https://rslib.rs/config/lib/auto-extension), but defaults to off for Father 4 compatibility. Father also matches declaration extensions when enabled, avoiding type entry points such as `.mjs` files without corresponding `.d.mts` files.

The root package.json supplies the default package type. Package.json files copied from sources define their own output scopes, including relocated `overrides`. Explicit `.mjs`, `.cjs`, `.d.mts` and `.d.cts` files retain their extensions. No package.json is generated or modified.

Enabling this option also enables `redirect.js.extension` and `redirect.dts.extension` by default so module references match the emitted files. Supports Babel, esbuild, SWC, parallel builds, caching, watch and source maps. After changing package types or output configuration, or disabling the option, restart with a default clean build to avoid retaining old files with `clean: false` or an existing watch process.

### **redirect**

- **Type**: `{ js?: { extension?: boolean }; dts?: { extension?: boolean } }`
- **Default**: each `extension` follows `autoExtension`, otherwise `false`
- Supports `esm`, `cjs` and `overrides`

Uses [Rslib's redirect](https://rslib.rs/config/lib/redirect) naming to control relative module references in JavaScript and declarations independently. `js.extension` handles imports, re-exports, literal `import()` and literal `require()` in CJS output. `dts.extension` handles declaration imports, re-exports, type imports and module augmentations.

For example, `./utils` becomes `./utils.mjs` or `./utils/index.mjs` according to emitted files; existing `./utils.js` references are updated too. Paths follow actual output locations, including relocated `overrides`. Unresolved extensionless relative references produce an error. This option does not change filenames or external dependency paths.

Enable `redirect` alone to complete internal references while retaining `.js` filenames. Explicitly disable either `extension` to leave those references for a consumer's build tool to process.

### **resolveDepSubpath**

- **Type**: `boolean`
- **Default**: `false`
- **ESM only**: applies to the entire ESM build, including `overrides`

Completes subpaths of dependencies without `exports`, for example `dayjs/plugin/weekday` → `dayjs/plugin/weekday.js`, in JavaScript and declarations. Package roots, dependencies with `exports`, and unresolved dependencies retain their specifiers. Like tsdown's `deps.resolveDepSubpath`, this is independent of internal reference completion; enable it when legacy dependencies need it.

These capabilities require explicit opt-in. Neither `exports.import` nor the root package.json `type` enables them automatically. Existing configurations retain their default build behavior. These options do not convert CommonJS dependencies into ESM or make CSS imports and browser-only APIs available in Node.js. See the [native ESM publishing example](./guide/esm-cjs.en-US.md#native-esm-in-nodejs).

### **transformer**

- **Type**: `"babel" | "esbuild" | "swc"`
- **Default**: `<auto>`
- Specifies the **compilation tool**:
  - `"babel"` (default for browser)
  - `"esbuild"` (default for node)
  - `"swc"`

### **overrides**

- **Type**: `object`
- **Default**: `undefined`
- Allows **subdirectory-specific configurations**.

Example:

```ts
export default {
  esm: {
    overrides: {
      'src/server': {
        platform: 'node', // Compile `server` folder with `node` target
      },
    },
  },
};
```

### **ignores**

- **Type**: `string[]`
- **Default**: `undefined`
- Specifies **files to ignore** during transformation.
- Supports **glob patterns**.

> **Note**: By default, **Markdown and test files are ignored**.

### **parallel**

- **Type**: `boolean`
- **Default**: `false`
- Enables **parallel compilation**.

---

## **Bundle Mode (UMD & Prebundle)**

### **umd**

- **Type**: `object`
- **Default**: `undefined`
- Configures **source bundling** into **UMD format**.
- Supports overriding **general configurations**.

### **name**

- **Type**: `string`
- **Default**: `undefined`
- Specifies the **library name** in the UMD output.

Example:

```ts
export default {
  umd: {
    name: 'fatherDemo',
  },
};
```

### **extractCSS**

- **Type**: `boolean`
- **Default**: `true`
- Extracts CSS into a **separate file**.

### **entry**

- **Type**: `string | Record<string, Config>`
- **Default**: `"src/index"`
- Specifies the **entry file(s)** for bundling.
- Supports **multiple entry points**.

Example:

```ts
export default {
  umd: {
    entry: {
      'src/browser': {},
      'src/server': { platform: 'node' },
    },
  },
};
```

### **output**

- **Type**: `string | { path?: string; filename?: string }`
- **Default**: `"dist/umd"`
- Specifies **output directory and filename**.

### **externals**

- **Type**: `Record<string, string>`
- **Default**: `undefined`
- Defines **external dependencies**.

### **chainWebpack**

- **Type**: `function`
- **Default**: `undefined`
- Uses **webpack-chain** to customize **Webpack configuration**.

---

## **Prebundle Mode**

Prebundling is used to **reduce install size and improve project stability**, especially for **Node.js tools and frameworks**.

### **output**

- **Type**: `string`
- **Default**: `"compiled"`
- Specifies the **prebundle output directory**.

### **deps**

- **Type**: `string[] | Record<string, { minify?: boolean; dts?: boolean }>`
- **Default**: `undefined`
- Defines **dependencies to prebundle**.

Example:

```ts
export default {
  prebundle: {
    deps: ['rimraf'],
    deps: {
      rimraf: { minify: false },
    },
  },
};
```

### **extraDtsDeps**

- **Type**: `string[]`
- **Default**: `undefined`
- Specifies dependencies **only needing TypeScript declaration files (`.d.ts`)**.

---

## **Other Configurations**

### **plugins**

- **Type**: `string[]`
- **Default**: `undefined`
- Defines additional **Father plugins**.

Example:

```ts
// plugin.ts
import type { IApi } from 'father';

export default (api: IApi) => {
  api.modifyConfig((memo) => {
    return memo;
  });
};

// .fatherrc.ts
export default {
  plugins: ['./plugin.ts'],
};
```

### **presets**

- **Type**: `string[]`
- **Default**: `undefined`
- Defines additional **Father plugin presets**.

Example:

```ts
export default (api: IApi) => ({
  presets: [require.resolve('./other-preset')],
  plugins: [require.resolve('./plugin-a'), require.resolve('./plugin-b')],
});
```
