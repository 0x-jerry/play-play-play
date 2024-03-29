import { Buttons } from '@/lib/gamepad'
import { NES, Controller } from 'jsnes'
import RingBuffer from 'ringbufferjs'
import { useXGamepad } from './useXGamepad'

const size = {
  w: 256,
  h: 240,
  scale: 2,
}

interface UseNESOption {
  onKeyEvent?(fnName: 'buttonDown' | 'buttonUp', params: any): void
  player?: number
}

export function useNES(opt?: UseNESOption) {
  const buffer = new RingBuffer<number>(new AudioContext().sampleRate * 2)

  const _canvas = createCanvas()
  const _audio = createAudioContext(processAudio)

  const { ctx2d } = _canvas

  const ctx = reactive({
    paused: false,
  })

  const cache = {
    _id: 0,
  }

  const output = {
    buf32: new Uint32Array(0),
    audio: {
      l: [],
      r: [],
    },
  }

  // Initialize and set up outputs
  const nes = new NES({
    onFrame: (buffer: number[]) => {
      for (let y = 0; y < size.h; ++y) {
        for (let x = 0; x < size.w; ++x) {
          const i = y * size.w + x
          // Convert pixel from NES BGR to canvas ABGR
          output.buf32[i] = 0xff000000 | buffer[i] // Full alpha
        }
      }
    },
    onStatusUpdate: console.log,
    sampleRate: _audio.ctx.sampleRate,
    onAudioSample: (l: number, r: number) => {
      buffer.enq(l)
      buffer.enq(r)
    },
  })

  initController()

  onUnmounted(() => {
    cancelAnimationFrame(cache._id)
  })

  return {
    nes,
    audio: _audio,
    video: _canvas,
    mount(el: HTMLElement) {
      el.appendChild(_canvas.dom)
    },
    init() {
      ctx2d.fillStyle = 'black'
      ctx2d.fillRect(0, 0, size.w, size.h)

      const image = ctx2d.getImageData(0, 0, size.w, size.h)

      // Allocate framebuffer array.
      const buf = new ArrayBuffer(image.data.length)
      output.buf32 = new Uint32Array(buf)

      // Set alpha
      for (var i = 0; i < output.buf32.length; ++i) {
        output.buf32[i] = 0xff000000
      }
    },
    load,
    pause() {
      ctx.paused = true
    },
    keyEvent(fnName: 'buttonDown' | 'buttonUp', button: number, player: number) {
      nes[fnName](player, button)
    },
  }

  function processAudio(e: AudioProcessingEvent) {
    const left = e.outputBuffer.getChannelData(0)
    const right = e.outputBuffer.getChannelData(1)
    const size = left.length

    if (buffer.size() < size * 2) {
      return
    }

    try {
      const samples = buffer.deqN(size * 2)
      for (let i = 0; i < size; i++) {
        left[i] = samples[i * 2]
        right[i] = samples[i * 2 + 1]
      }
    } catch (e) {
      for (let j = 0; j < size; j++) {
        left[j] = 0
        right[j] = 0
      }
      return
    }
  }

  function render() {
    const imageData = new ImageData(new Uint8ClampedArray(output.buf32.buffer), size.w, size.h)

    ctx2d.putImageData(scaleImage(imageData, size.scale), 0, 0)
  }

  async function load(romPath: string) {
    const romData = await loadRom(romPath)

    nes.loadROM(romData)

    _audio.start()
    run()
  }

  function run() {
    nes.frame()
    render()

    cache._id = requestAnimationFrame(run)
  }

  function initController() {
    const keyMap: Record<string, number> = {
      w: Controller.BUTTON_UP,
      s: Controller.BUTTON_DOWN,
      a: Controller.BUTTON_LEFT,
      d: Controller.BUTTON_RIGHT,

      j: Controller.BUTTON_A,
      k: Controller.BUTTON_B,
      g: Controller.BUTTON_SELECT,
      h: Controller.BUTTON_START,
    }

    useEventListener('keydown', (e) => keyboard(e, 'buttonDown'))

    useEventListener('keyup', (e) => keyboard(e, 'buttonUp'))

    // setup with gamepad
    const gamepadButtonsMap: Partial<Record<Buttons, any>> = {
      a: Controller.BUTTON_A,
      b: Controller.BUTTON_B,
      view: Controller.BUTTON_SELECT,
      menu: Controller.BUTTON_START,
    }

    useXGamepad({
      connect(vg) {
        vg.controller.on('press', (key) => {
          const nesKey = gamepadButtonsMap[key]
          if (nesKey != null) {
            keyEvent('buttonDown', nesKey)
          }
        })

        vg.controller.on('release', (key) => {
          const nesKey = gamepadButtonsMap[key]
          if (nesKey != null) {
            keyEvent('buttonUp', nesKey)
          }
        })

        vg.controller.on('move', (d, data) => {
          if (d !== 'left') return

          const threshold = 0.4

          if (data.x < -threshold) {
            keyEvent('buttonDown', Controller.BUTTON_LEFT)
          } else if (data.x < threshold) {
            keyEvent('buttonUp', Controller.BUTTON_LEFT)
            keyEvent('buttonUp', Controller.BUTTON_RIGHT)
          } else {
            keyEvent('buttonDown', Controller.BUTTON_RIGHT)
          }

          if (data.y < -threshold) {
            keyEvent('buttonDown', Controller.BUTTON_UP)
          } else if (data.y < threshold) {
            keyEvent('buttonUp', Controller.BUTTON_UP)
            keyEvent('buttonUp', Controller.BUTTON_DOWN)
          } else {
            keyEvent('buttonDown', Controller.BUTTON_DOWN)
          }
        })
      },
    })

    //  ----------
    function keyboard(e: KeyboardEvent, fnName: 'buttonDown' | 'buttonUp') {
      const k = keyMap[e.key]

      if (k != null) {
        keyEvent(fnName, k)
      }
    }
  }

  function keyEvent(fnName: 'buttonDown' | 'buttonUp', button: number, player?: number) {
    nes[fnName](player || opt?.player || 1, button)
    opt?.onKeyEvent?.(fnName, [button])
  }
}

function createCanvas() {
  const canvas = document.createElement('canvas')
  canvas.style.width = '100%'
  canvas.width = size.w * size.scale
  canvas.height = size.h * size.scale

  const ctx2d = canvas.getContext('2d')!

  return {
    ctx2d,
    dom: canvas,
  }
}

function createAudioContext(process: ScriptProcessorNode['onaudioprocess']) {
  const bufferSize = 8192

  const audioCtx = new AudioContext()
  const scriptNode = audioCtx.createScriptProcessor(bufferSize * 2, 0, 2)
  const source = audioCtx.createBufferSource()

  scriptNode.onaudioprocess = process
  scriptNode.connect(audioCtx.destination)

  source.connect(scriptNode)

  const destination = audioCtx.createMediaStreamDestination()
  scriptNode.connect(destination)

  const mediaStream = destination.stream

  return {
    ctx: audioCtx,
    media: mediaStream,
    start() {
      source.start()
    },
    stop() {
      source.stop()
    },
  }
}

async function loadRom(romPath: string) {
  const res = await (await fetch(romPath)).blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)

    reader.onerror = (e) => reject(e)
    reader.readAsBinaryString(res)
  })
}

function scaleImage(imagedata: ImageData, scale: number): ImageData {
  // 获取图像数据的宽度和高度
  const width = imagedata.width
  const height = imagedata.height

  // 创建新的 ImageData 对象，用于存储放大后的图像数据
  const scaledImageData = new ImageData(width * scale, height * scale)

  // 循环遍历每个像素
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 获取当前像素的位置
      const index = (y * width + x) * 4

      // 获取当前像素的颜色值
      const red = imagedata.data[index]
      const green = imagedata.data[index + 1]
      const blue = imagedata.data[index + 2]
      const alpha = imagedata.data[index + 3]

      // 在放大后的图像数据中写入当前像素的颜色值
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const scaledIndex = ((y * scale + sy) * width * scale + (x * scale + sx)) * 4
          scaledImageData.data[scaledIndex] = red
          scaledImageData.data[scaledIndex + 1] = green
          scaledImageData.data[scaledIndex + 2] = blue
          scaledImageData.data[scaledIndex + 3] = alpha
        }
      }
    }
  }

  return scaledImageData
}
