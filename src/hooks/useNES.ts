import jsnes from 'jsnes'

const { NES, Controller } = jsnes

const size = {
  w: 256,
  h: 240,
}

export function useNES() {
  const _canvas = document.createElement('canvas')
  _canvas.width = size.w
  _canvas.height = size.h
  const ctx2d = _canvas.getContext('2d')!

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
    onFrame: function (buffer: any) {
      var i = 0
      for (var y = 0; y < size.h; ++y) {
        for (var x = 0; x < size.w; ++x) {
          i = y * size.w + x
          // Convert pixel from NES BGR to canvas ABGR
          output.buf32[i] = 0xff000000 | buffer[i] // Full alpha
        }
      }
    },
    onStatusUpdate: console.log,
    onAudioSample: function (l: any, r: any) {
      // console.log(l, r)
      // audio_samples_L[audio_write_cursor] = l
      // audio_samples_R[audio_write_cursor] = r
      // audio_write_cursor = (audio_write_cursor + 1) & SAMPLE_MASK
    },
  })

  return {
    nes,
    mount(el: HTMLElement) {
      el.appendChild(_canvas)
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
    if (ctx.paused) return

    const cCtx = _canvas.getContext('2d')!

    const imageData = new ImageData(new Uint8ClampedArray(output.buf32.buffer), size.w, size.h)

    cCtx.putImageData(imageData, 0, 0)
  }

  async function load(romPath: string) {
    const romData = await loadRom(romPath)

    nes.loadROM(romData)

    run()
  }

  function run() {
    nes.frame()
    render()

    requestAnimationFrame(run)
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
