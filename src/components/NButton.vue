<script lang="ts" setup>
withDefaults(
  defineProps<{
    theme?: 'primary' | 'success' | 'warning' | 'error'
    disabled?: boolean
  }>(),
  {
    theme: 'primary',
  },
)
</script>

<template>
  <button :class="['nes-btn', `is-${theme}`, { 'is-disabled': disabled }]" :disabled="disabled">
    <slot></slot>
  </button>
</template>

<style lang="less"></style>
