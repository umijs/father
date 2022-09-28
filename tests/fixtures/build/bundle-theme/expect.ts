export default (files: Record<string, string>) => {
  expect(files['umd/index.min.css']).toContain('#000');
};
