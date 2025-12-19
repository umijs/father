export default (files: Record<string, string>) => {
  expect(files['umd/index.min.js']).toContain('require("fs")');
  // Ensure process is not shimmed - it should reference the global process
  // not be polyfilled with browser shims
  expect(files['umd/index.min.js']).toContain('process');
  // Should NOT contain the node-libs-browser process polyfill
  expect(files['umd/index.min.js']).not.toContain('process/browser');
};
