interface test {
  // expect doctor parser skip this file
  // @ts-expect-error
  desensitizeCache?: <P, R = any>(params: P = any) => Promise<R>;
}
