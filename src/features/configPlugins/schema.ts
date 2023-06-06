import type { Root, SchemaLike } from '@umijs/utils/compiled/@hapi/joi';
import { IFatherJSTransformerTypes, IFatherPlatformTypes } from '../../types';

function getCommonSchemas(): Record<string, (Joi: Root) => any> {
  return {
    platform: (Joi) =>
      Joi.equal(
        IFatherPlatformTypes.BROWSER,
        IFatherPlatformTypes.NODE,
      ).default(IFatherPlatformTypes.BROWSER),
    define: (Joi) =>
      Joi.object().pattern(Joi.string(), Joi.string()).optional(),
    alias: (Joi) => Joi.object().pattern(Joi.string(), Joi.string()).optional(),
    postcssOptions: (Joi) => Joi.object().optional(),
    autoprefixer: (Joi) => Joi.object().optional(),
    extraBabelPresets: (Joi) => Joi.array().optional(),
    extraBabelPlugins: (Joi) => Joi.array().optional(),
    sourcemap: (Joi) => Joi.boolean().optional(),
    targets: (Joi) => Joi.object().optional(),
  };
}

function getCommonSchemasJoi(Joi: Root) {
  const schemas = getCommonSchemas();

  return Object.keys(schemas).reduce((jois, key) => {
    jois[key] = schemas[key](Joi);

    return jois;
  }, {} as Record<string, SchemaLike | SchemaLike[]>);
}

function getBundlessSchemas(Joi: Root) {
  return Joi.object({
    ...getCommonSchemasJoi(Joi),
    input: Joi.string(),
    output: Joi.string(),
    transformer: Joi.equal(
      IFatherJSTransformerTypes.BABEL,
      IFatherJSTransformerTypes.ESBUILD,
      IFatherJSTransformerTypes.SWC,
    ).optional(),
    overrides: Joi.object(),
    ignores: Joi.array().items(Joi.string()),
  });
}

export function getSchemas(): Record<string, (Joi: Root) => any> {
  return {
    ...getCommonSchemas(),
    extends: (Joi) => Joi.string(),
    esm: (Joi) => getBundlessSchemas(Joi),
    cjs: (Joi) => getBundlessSchemas(Joi),
    umd: (Joi) =>
      Joi.object({
        ...getCommonSchemasJoi(Joi),
        entry: Joi.alternatives()
          .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.object()))
          .optional(),
        output: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
        externals: Joi.alternatives().try(
          Joi.object(),
          Joi.string(),
          Joi.array(),
        ),
        chainWebpack: Joi.function().optional(),
        extractCSS: Joi.boolean().optional(),
        name: Joi.string().optional(),
        theme: Joi.object().pattern(Joi.string(), Joi.string()),
      }),
    prebundle: (Joi) =>
      Joi.object({
        output: Joi.string(),
        deps: Joi.alternatives()
          .try(Joi.array().items(Joi.string()), Joi.object())
          .optional(),
        extraDtsDeps: Joi.array().items(Joi.string()),
        extraExternals: Joi.object()
          .pattern(Joi.string(), Joi.string())
          .optional(),
      }),
    plugins: (Joi) => Joi.array().items(Joi.string()),
    presets: (Joi) => Joi.array().items(Joi.string()),
  };
}
