export default (files: Record<string, string>) => {
  expect(files['umd/index.min.js']).toMatch(/color:\s*red/);
};
