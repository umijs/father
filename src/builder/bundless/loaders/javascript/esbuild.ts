import type { IJSTransformer } from '../types';

/**
 * esbuild transformer
 */
const esbuildTransformer: IJSTransformer = function (content) {
  // TODO: transform content
  return content;
};

export default esbuildTransformer;
