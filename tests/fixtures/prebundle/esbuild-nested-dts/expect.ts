export default (files: Record<string, string>) => {
  // dep a
  expect(files['a/index.d.ts']).toContain('type a = string;');
  // dep b nested in a
  expect(files['a/index.d.ts']).toContain('type b = boolean;');
  // dep c nested in b
  expect(files['a/index.d.ts']).toContain('type c = number;');
  // dep @org/d nested in c
  expect(files['a/index.d.ts']).toContain('type d = object;');
};
