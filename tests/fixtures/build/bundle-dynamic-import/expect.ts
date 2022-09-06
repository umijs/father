export default (files: Record<string, string>) => {
  // expect single dist file (no async chunks)
  expect(Object.keys(files)).toHaveLength(1);
};
