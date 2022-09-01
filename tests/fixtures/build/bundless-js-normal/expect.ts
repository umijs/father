import fs from 'fs';
import path from 'path';

export default (files: Record<string, string>) => {
  // esbuild special
  expect(files['cjs/index.js']).toContain('__toCommonJS(');

  // babel special
  expect(files['esm/index.js']).toContain('export default');

  // jsx to js
  expect(files['esm/other.js']).not.toBeUndefined();

  // copy for non-js-like files
  expect(files['esm/raw.txt']).toEqual(
    fs.readFileSync(path.join(__dirname, './src/raw.txt'), 'utf-8'),
  );
};
