export default (files: Record<string, string>) => {
  // esm use classic jsx runtime
  expect(files['esm/index.js']).toContain('React.createElement');
  expect(files['esm/index.js']).toContain('React.Fragment');

  // umd use classic jsx runtime
  expect(files['umd/index.min.js']).toContain('.createElement');
  expect(files['umd/index.min.js']).toContain('.Fragment');
  expect(files['umd/index.min.js']).toContain('require("react")');
  expect(files['umd/index.min.js']).not.toContain('ReactCurrentOwner');
  expect(
    /(\w)+\.jsx\)\(\1\.Fragment/.test(files['umd/index.min.js']),
  ).toBeFalsy();
};
