export default (files: Record<string, string>) => {
  // esm use classic jsx runtime
  expect(files['esm/index.js']).toContain('React.createElement');
  expect(files['esm/index.js']).toContain('React.Fragment');

  // umd use classic jsx runtime
  expect(files['umd/index.min.js']).toContain('.createElement');
  expect(files['umd/index.min.js']).toContain('.Fragment');
};
