export function getPkgNameFromPath(p: string) {
  return p.match(/^(?:@[a-z\d][\w-.]*\/)?[a-z\d][\w-.]*/i)?.[0];
}
