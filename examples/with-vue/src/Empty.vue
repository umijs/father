<template>
  <div :class="ns.b()">
    <div :class="ns.e('image')" :style="imageStyle">
      <img v-if="image" :src="image" ondragstart="return false" />
      <slot v-else name="image">
        <img-empty />
      </slot>
    </div>
    <div :class="ns.e('description')">
      <slot v-if="$slots.description" name="description" />
      <p v-else>{{ emptyDescription }}</p>
    </div>
    <div v-if="$slots.default" :class="ns.e('bottom')">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { emptyProps } from './empty';

import type { CSSProperties } from 'vue';

const props = defineProps(emptyProps);

const emptyDescription = computed(() => props.description);
const imageStyle = computed<CSSProperties>(() => ({
  width: props.imageSize,
}));
</script>
