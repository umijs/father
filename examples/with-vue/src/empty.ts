import { buildProps } from '@/utils/buildProps';
import type { ExtractPropTypes } from 'vue';

export const emptyProps = buildProps({
  image: {
    type: String,
    default: '',
  },
  imageSize: Number,
  description: {
    type: String,
    default: '',
  },
} as const);

export type EmptyProps = ExtractPropTypes<typeof emptyProps>;
