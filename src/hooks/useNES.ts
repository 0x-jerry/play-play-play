import { NES, Controller } from 'jsnes'
import RingBuffer from 'ringbufferjs'

const size = {
  w: 256,
  h: 240,
}

var SAMPLE_COUNT = 4 * 1024
var SAMPLE_MASK = SAMPLE_COUNT - 1

export function useNES() {
  const buffer = new RingBuffer<number>(new AudioContext().sampleRate * 2)

  const _canvas = createCanvas()
  const _audio = createAudioContext((e) => {
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
  })

  const { ctx2d } = _canvas

  const ctx = reactive({
    paused: false,
  })

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

  initController(nes)

  return {
    nes,
    audio: _audio,
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
  }

  function render() {
    const imageData = new ImageData(new Uint8ClampedArray(output.buf32.buffer), size.w, size.h)

    ctx2d.putImageData(imageData, 0, 0)
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

    requestAnimationFrame(run)
  }
}

function createCanvas() {
  const canvas = document.createElement('canvas')
  canvas.style.width = '100%'
  canvas.width = size.w
  canvas.height = size.h

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

  return {
    ctx: audioCtx,
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

function initController(nes: NES) {
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

  useEventListener('keydown', (e) => keyboard(e, nes.buttonDown))

  useEventListener('keyup', (e) => keyboard(e, nes.buttonUp))

  function keyboard(e: KeyboardEvent, fn: any) {
    const k = keyMap[e.key]
    const player = 1

    if (k != null) {
      fn(player, k)
    }
  }
}

function buffer() {}
