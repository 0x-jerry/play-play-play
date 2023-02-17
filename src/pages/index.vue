<script lang="ts" setup>
import { useNES } from '@/hooks/useNES'

const output = ref<HTMLElement>()

const ns = useNES()

onMounted(async () => {
  ns.mount(output.value!)

  loadRom()
})

async function loadRom() {
  if (!output.value) return

  ns.init()
  await ns.load('./roms/InterglacticTransmissing.nes')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center w-screen h-screen gap-2">
    <div ref="output"></div>
    <NButton @click="loadRom">Load ROM</NButton>
  </div>
</template>

<style lang="less">
//
</style>
