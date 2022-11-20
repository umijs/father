import { build, BuildResult } from '@umijs/bundler-utils/compiled/esbuild';
import { IPreBundleConfig } from './config';

/**
 * Esbuild transformer for pre-bundle
 * @param dep dep name
 * @param opts options
 */
export async function esbuildTransformer(
  dep: string,
  opts: IPreBundleConfig['deps'][string],
): Promise<BuildResult> {
  const { output, nccConfig } = opts;
  const external = Object.keys(nccConfig.externals) as string[];

  return build({
    entryPoints: [dep],
    outfile: output,
    bundle: true,
    external,
    minify: nccConfig.minify,
    platform: 'node',
    format: 'cjs',
    plugins: [
      {
        name: 'plugin-father-prebundle-external',
        setup: (builder) => {
          builder.onResolve(
            // { filter: new RegExp(`^${external.join('|')}$`) },
            { filter: /.*/ },
            (args) => {
              const alias = nccConfig.externals[args.path];
              if (alias !== void 0) {
                return { path: alias, external: true };
              }

              return null;
            },
          );
        },
      },
    ],
  });
}
