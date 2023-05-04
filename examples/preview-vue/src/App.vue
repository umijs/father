<script setup lang="ts">
import { Hello, DemoJsx } from '@example/with-vue';
</script>

<template>
  <div class="main"></div>
  <Hello msg="hello father vue" />
  <DemoJsx />
</template>

<style scoped>
.main {
  padding: 20px;
}
</style>
