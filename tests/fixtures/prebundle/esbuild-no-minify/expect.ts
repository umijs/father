export default (files: Record<string, string>) => {
  // check comments in no-minify dist
  expect(files['rimraf/index.js']).toContain('module.exports = rimraf;');
};
