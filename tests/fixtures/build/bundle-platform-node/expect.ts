export default (files: Record<string, string>) => {
  expect(files['umd/index.min.js']).toContain('require("fs")');
  // Ensure process is not shimmed - it should reference the global process directly
  expect(files['umd/index.min.js']).toContain('process.argv');
  expect(files['umd/index.min.js']).toContain('process.cwd()');
  // Should NOT contain the browser polyfill for process (node-libs-browser)
  // The polyfill has signatures like: n.argv=[], n.cwd=function(){return"/"}
  expect(files['umd/index.min.js']).not.toContain('.argv=[]');
  expect(files['umd/index.min.js']).not.toContain('return"/"');
};
