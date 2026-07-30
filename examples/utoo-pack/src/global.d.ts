declare module '*.less' {
  const classes: Record<string, string>;
  export default classes;
}

declare function require(id: string): unknown;
