import { readFileSync } from 'fs';
import { join } from 'path';

export default (files: Record<string, string>) => {
  // umd
  expect(files['umd/index.min.js']).toContain(
    '//# sourceMappingURL=index.min.js.map',
  );

  // esm transform by babel
  expect('esm/index.js.map' in files).toBe(true);
  expect(files['esm/index.js']).toContain('//# sourceMappingURL=index.js.map');

  const map1 = JSON.parse(
    readFileSync(join(__dirname, 'dist/esm/index.js.map'), 'utf-8'),
  );
  expect(map1.sources[0]).toEqual('../../src/index.ts');

  const map2 = JSON.parse(
    readFileSync(join(__dirname, 'dist/esm/utils/index.js.map'), 'utf-8'),
  );
  expect(map2.sources[0]).toEqual('../../../src/utils/index.ts');

  // cjs transform by esbuild
  expect('cjs/index.js.map' in files).toBe(true);
  expect(files['cjs/index.js']).toContain('//# sourceMappingURL=index.js.map');
  const map3 = JSON.parse(
    readFileSync(join(__dirname, 'dist/cjs/index.js.map'), 'utf-8'),
  );
  expect(map3.sources[0]).toEqual('../../src/index.ts');

  const map4 = JSON.parse(
    readFileSync(join(__dirname, 'dist/cjs/utils/index.js.map'), 'utf-8'),
  );
  expect(map4.sources[0]).toEqual('../../../src/utils/index.ts');
};
