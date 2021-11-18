import type { Root } from '@umijs/core/compiled/@hapi/joi';
import type { ITransformerConfig } from './executor/bundless';

export interface ITransformer {
  new (config: ITransformerConfig): ITransformer;

  /**
   * transformer identifier
   * @note  such as babel or esbuild
   */
  id: string;

  /**
   * transformer special options schema
   * @note  use joi way
   */
  schema?: Record<string, Root>;

  /**
   * transform raw to result
   */
  process: (content: string) => string;
}
