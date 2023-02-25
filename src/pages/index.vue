<script lang="ts" setup>
import { useNES } from '@/hooks/useNES'
import { usePeer } from '@/hooks/usePeer'
import { useRouteQuery } from '@vueuse/router'

const output = ref<HTMLElement>()

const peerId = useRouteQuery('id', '')

const ns = useNES()

const fps = ref('')

interface MsgModel {
  type: string
  data?: any
}

const peer = usePeer({
  id: peerId,
  receive(data: MsgModel) {
    if (data?.type === 'keyEvent') {
      const [fn, params] = data.data || {}
      ns.keyEvent(fn, params[0], 2)
    }
  },
  connected(conn) {
    console.log(conn.peer, 'send call')
    const videoStream = ns.video.dom.captureStream(60)

    const audioStream = ns.audio.media

    const combinedStream = new MediaStream([
      //
      ...videoStream.getTracks(),
      ...audioStream.getTracks(),
    ])

    peer.peer.call(conn.peer, combinedStream)
  },
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
        <label for="name_field">ID: {{ peer.ctx.id }}</label>
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
