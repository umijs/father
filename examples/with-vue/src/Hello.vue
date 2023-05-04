<template>
  <div>{{ hello }} {{ msg }}</div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';

const hello = ref('hello vue');

defineProps({
  msg: {
    type: String,
    default: 'hello world',
  },
});
</script>
