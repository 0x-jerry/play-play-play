<script lang="ts" setup>
import { useNES } from '@/hooks/useNES'
import { usePeer } from '@/hooks/usePeer'
import { useRouteQuery } from '@vueuse/router'

const output = ref<HTMLElement>()

const hostId = useRouteQuery('host-id', '')

const ns = useNES({
  player: 2,
  onKeyEvent(fn, params) {
    console.log('send', fn, params)
    peer.send({
      type: 'keyEvent',
      data: [fn, params],
    })
  },
})

const fps = ref('')

interface MsgModel {
  type: string
  data: any
}

const peer = usePeer({
  receive(data: MsgModel) {
    if (data?.type === 'keyEvent') {
      const [fn, params] = data.data || {}
      ns.keyEvent(fn, params[0], 1)
    }
  },
  hostId,
})

useTimeoutPoll(
  () => {
    fps.value = parseInt(ns.nes.getFPS()).toFixed(0)
  },
  500,
  {
    immediate: true,
  },
)

onMounted(async () => {
  ns.mount(output.value!)
})

async function loadRom() {
  if (!output.value) return

  ns.init()
  await ns.load('./roms/Contra.nes')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center w-screen gap-2 mt-50px">
    <div class="info">
      <div class="nes-field">
        <input
          type="text"
          id="name_field"
          class="nes-input"
          placeholder="Host ID"
          v-model="hostId"
        />
        <span>Connected Host: {{ peer.connected }}</span>
      </div>
      <div>FPS: {{ fps }}</div>

      <!--  -->
    </div>
    <div ref="output" class="aspect-[256/240] w-600px"></div>
    <NButton @click="loadRom">Load ROM</NButton>
  </div>
</template>

<style lang="less">
//
</style>
