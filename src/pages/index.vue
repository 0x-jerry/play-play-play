<script lang="ts" setup>
const count = ref(0)
</script>

<template>
  <div class="flex items-center w-screen h-screen gap-2">
    <span>Hello, you can start with a counter: </span>
    <KButton @click="count++">+1</KButton>
    <span>
      {{ count }}
    </span>
    <KButton @click="count++">+1</KButton>
  </div>
</template>

<style lang="less"></style>
