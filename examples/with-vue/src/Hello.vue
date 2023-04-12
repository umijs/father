<template>
  <div>{{ hello }}</div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';

const hello = ref('hello vue');
</script>
