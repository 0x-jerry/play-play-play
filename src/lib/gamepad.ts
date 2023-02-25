import { EventEmitter } from '@0x-jerry/utils'

export type Buttons =
  | 'a'
  | 'b'
  | 'x'
  | 'y'
  | 'lBumper'
  | 'rBumper'
  | 'lTrigger'
  | 'rTrigger'
  | 'view'
  | 'menu'
  | 'lAxes'
  | 'rAxes'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'xbox'
  | 'dPad'

export interface GamepadData {
  axes: {
    left: GamepadAxes
    right: GamepadAxes
  }
  buttons: Record<Buttons, GamepadButton>
}

export interface GamepadAxes {
  /**
   * [-1, 1]
   */
  x: number

  /**
   * [-1, 1]
   */
  y: number
}

export type SupportDevice = 'xbox'

const gamepadMapConfig: Record<SupportDevice, Record<number, Buttons>> = {
  xbox: {
    0: 'a',
    1: 'b',
    2: 'x',
    3: 'y',
    4: 'lBumper',
    5: 'rBumper',
    6: 'lTrigger',
    7: 'rTrigger',
    8: 'view',
    9: 'menu',
    10: 'lAxes',
    11: 'rAxes',
    12: 'up',
    13: 'down',
    14: 'left',
    15: 'right',
    16: 'xbox',
    17: 'dPad',
  },
}

export type GamepadControllerEvents = {
  press(button: Buttons, data: GamepadButton): void

  release(button: Buttons, data: GamepadButton): void

  move(joystick: 'left' | 'right', data: GamepadAxes): void
}

export class GamepadController extends EventEmitter<GamepadControllerEvents> {
  _rafId = 0

  _data?: GamepadData

  constructor(public id: string) {
    super()

    this._updateLoop()
  }

  dispose() {
    cancelAnimationFrame(this._rafId)
  }

  _updateLoop = () => {
    if (document.hasFocus()) {
      this._update()
    }

    this._rafId = requestAnimationFrame(this._updateLoop)
  }

  _update = () => {
    const padData = {
      axes: {
        left: {},
        right: {},
      },
      buttons: {},
    } as GamepadData

    const padDevice = navigator.getGamepads().find((n) => n?.id === this.id)
    if (!padDevice) return

    const [lx, ly, rx, ry] = padDevice.axes

    padData.axes.left.x = lx
    padData.axes.left.y = ly
    padData.axes.right.x = rx
    padData.axes.right.y = ry

    padDevice.buttons.forEach((item, idx) => {
      const buttonName = gamepadMapConfig.xbox[idx]

      padData.buttons[buttonName] = item
    })

    const preData = this._data

    if (!preData) {
      this._data = padData
      return
    }

    // compare axes
    if (isMoved(preData.axes.left, padData.axes.left)) {
      this.emit('move', 'left', padData.axes.left)
      preData.axes.left = padData.axes.left
    }

    if (isMoved(preData.axes.right, padData.axes.right)) {
      this.emit('move', 'right', padData.axes.right)
      preData.axes.right = padData.axes.right
    }

    // compare key
    Object.keys(padData.buttons).forEach((_name) => {
      const btnName = _name as Buttons
      const preButtonData = preData.buttons[btnName]
      const currentButtonData = padData.buttons[btnName]

      if (
        currentButtonData.pressed !== preButtonData.pressed ||
        currentButtonData.touched !== preButtonData.touched ||
        !isNearEnough(currentButtonData.value, preButtonData.value)
      ) {
        if (currentButtonData.pressed || currentButtonData.touched) {
          this.emit('press', btnName, currentButtonData)
        } else {
          this.emit('release', btnName, currentButtonData)
        }

        preData.buttons[btnName] = padData.buttons[btnName]
      }
    })
  }
}

function isMoved(axes1: GamepadAxes, axes2: GamepadAxes) {
  return !isNearEnough(axes1.x, axes2.x) || !isNearEnough(axes1.y, axes2.y)
}

function isNearEnough(n1: number, n2: number) {
  return Math.abs(n1 - n2) < 0.01
}
