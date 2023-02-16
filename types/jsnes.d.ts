/** Declaration file generated by dts-gen */

declare module 'jsnes' {
  export class Controller {
    constructor()

    buttonDown(key: any): void

    buttonUp(key: any): void

    static BUTTON_A: number

    static BUTTON_B: number

    static BUTTON_DOWN: number

    static BUTTON_LEFT: number

    static BUTTON_RIGHT: number

    static BUTTON_SELECT: number

    static BUTTON_START: number

    static BUTTON_UP: number
  }

  export class NES {
    constructor(opts: any)

    buttonDown(controller: any, button: any): void

    buttonUp(controller: any, button: any): void

    frame(): void

    fromJSON(s: any): void

    getFPS(): any

    loadROM(data: any): void

    reloadROM(): void

    reset(): void

    setFramerate(rate: any): void

    toJSON(): any

    zapperFireDown(): void

    zapperFireUp(): void

    zapperMove(x: any, y: any): void
  }
}