<script lang="ts" setup>
const count = ref(0)
</script>

<template>
  <div class="flex items-center w-screen h-screen gap-2">
    <span>Hello, you can start with a counter: </span>
    <button @click="count++">+1</button>
    <span>
      {{ count }}
    </span>
    <button @click="count++">+1</button>
  </div>
</template>

<style lang="less"></style>
