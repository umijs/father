import type { Root, SchemaLike } from '@umijs/utils/compiled/@hapi/joi';
import { IFatherJSTransformerTypes, IFatherPlatformTypes } from '../../types';

function getCSSSchemas(): Record<string, (Joi: Root) => any> {
  return {
    preprocessorsOptions: (Joi) => Joi.object().optional(),
    postcssOptions: (Joi) => Joi.object().optional(),
    autoprefixer: (Joi) => Joi.object().optional(),
    theme: (Joi) => Joi.object().pattern(Joi.string(), Joi.string()),
  };
}

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
    css: (Joi) =>
      Joi.object({
        ...getSchemasJoi(getCSSSchemas(), Joi),
      }).optional(),
  };
}

function getSchemasJoi(schemas: Record<string, (Joi: Root) => any>, Joi: Root) {
  return Object.keys(schemas).reduce<Record<string, SchemaLike | SchemaLike[]>>(
    (jois, key) => {
      jois[key] = schemas[key](Joi);

      return jois;
    },
    {},
  );
}

function getBundlessSchemas(Joi: Root) {
  return Joi.object({
    ...getSchemasJoi(getCommonSchemas(), Joi),
    ...getSchemasJoi(getCSSSchemas(), Joi),
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
        ...getSchemasJoi(getCommonSchemas(), Joi),
        ...getSchemasJoi(getCSSSchemas(), Joi),
        entry: Joi.alternatives()
          .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.object()))
          .optional(),
        output: Joi.string().optional(),
        externals: Joi.alternatives().try(
          Joi.object(),
          Joi.string(),
          Joi.array(),
        ),
        chainWebpack: Joi.function().optional(),
        extractCSS: Joi.boolean().optional(),
        name: Joi.string().optional(),
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
