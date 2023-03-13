import type Sass from 'sass';
import { IFatherCSSPreprocessorTypes } from '../../../../types';
import { loadPreprocessor } from '../../../utils';
import type { ICSSPreprocessor } from '../types';

const sassPreprocessor: ICSSPreprocessor = async function (content: string) {
  const { render } = loadPreprocessor(
    IFatherCSSPreprocessorTypes.SASS,
    this.paths.cwd,
  );

  const { sourcemap, css: cssConfig } = this.config ?? {};
  const { preprocessorsOptions } = cssConfig ?? {};
  const { sass: userOptions = {} } = preprocessorsOptions ?? {};

  const options: Sass.Options = {
    // support .sass file
    indentedSyntax: /\.sass$/.test(this.paths.fileAbsPath),
    data: content,
    file: this.paths.fileAbsPath,
    // for sourceMap url
    outFile: this.paths.fileAbsPath.replace(/\.s(a|c)ss$/, '.css'),
    sourceMap: sourcemap,
    sourceMapContents: true,
    ...userOptions,
  };

  const { css, map } = await new Promise<Sass.Result>((resolve, reject) => {
    render(options, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

  if (map) {
    return [css.toString(), map.toString()];
  }

  return [css.toString()];
};

export default sassPreprocessor;
