// import type Less from 'less';
import path from 'path';
import { addSourceMappingUrl, loadPreprocessor } from '../../../utils';
import { IFatherCSSPreprocessorTypes } from '../../../../types';
import type { ICSSPreprocessor } from '../types';

const lessPreprocessor: ICSSPreprocessor = async function (content: string) {
  const { render } = loadPreprocessor(
    IFatherCSSPreprocessorTypes.LESS,
    this.paths.cwd,
  );

  const { sourcemap, css: cssConfig } = this.config ?? {};
  const { preprocessorsOptions } = cssConfig ?? {};
  const { less: userOptions = {} } = preprocessorsOptions ?? {};

  const options: Less.Options = {
    filename: this.paths.itemDistAbsPath,
    plugins: [...(userOptions.plugins ?? [])],
    ...(sourcemap
      ? {
          sourceMap: {
            outputSourceFiles: true,
            sourceMapFileInline: false,
            sourceMapBasepath: path.dirname(this.paths.itemDistAbsPath),
          },
        }
      : {}),
    ...userOptions,
  };

  const { css, map } = await new Promise<Less.RenderOutput>(
    (resolve, reject) => {
      render(content, options, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res as Less.RenderOutput);
        }
      });
    },
  );

  if (map) {
    return [
      addSourceMappingUrl(css.toString(), this.paths.itemDistAbsPath),
      map.toString(),
    ];
  }

  return [css.toString()];
};

export default lessPreprocessor;
