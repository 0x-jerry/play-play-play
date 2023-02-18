<script lang="ts" setup>
import { useNES } from '@/hooks/useNES'

const output = ref<HTMLElement>()

const ns = useNES()

const freq = ref('')

useRafFn(
  () => {
    freq.value = ns.audio.freq.toString()
  },
  {
    immediate: true,
  },
)

onMounted(async () => {
  ns.mount(output.value!)

  // loadRom()
})

async function loadRom() {
  if (!output.value) return

  ns.init()
  await ns.load('./roms/Super Mario Bros.nes')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center w-screen h-screen gap-2">
    <div class="info">freq: {{ freq }}</div>
    <div ref="output" class="aspect-[256/240] w-600px"></div>
    <NButton @click="loadRom">Load ROM</NButton>
  </div>
</template>

<style lang="less">
//
</style>
