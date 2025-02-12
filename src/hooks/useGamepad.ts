import { EventEmitter } from '@0x-jerry/utils'
import { useEventListener, useRafFn } from '@vueuse/core'
import { get, set } from 'lodash-es'
import { reactive } from 'vue'

interface XPadEvents {
  onConnected: [gamepad: Gamepad]
  onDisconnected: [gamepad: Gamepad]
  onChange: [key: keyof GamepadMapping, value: number]
}

export const ButtonStatus = {
  released: 0,
  pressed: 1,
}

interface GamepadMapping {
  'axis.left.button': number
  'axis.left.x': number
  'axis.left.y': number

  'axis.right.x': number
  'axis.right.y': number
  'axis.right.button': number

  'button.left.left': number
  'button.left.right': number
  'button.left.top': number
  'button.left.bottom': number
  'button.left.LT': number
  'button.left.LB': number

  'button.right.left': number
  'button.right.right': number
  'button.right.top': number
  'button.right.bottom': number
  'button.right.RT': number
  'button.right.RB': number

  'button.center.left': number
  'button.center.center': number
  'button.center.right': number
}

const standardMapping: GamepadMapping = {
  'axis.left.button': 10,
  'axis.left.x': 0,
  'axis.left.y': 1,

  'axis.right.button': 11,
  'axis.right.x': 2,
  'axis.right.y': 3,

  'button.left.left': 14,
  'button.left.right': 15,
  'button.left.top': 12,
  'button.left.bottom': 13,
  'button.left.LT': 4,
  'button.left.LB': 6,

  'button.right.left': 2,
  'button.right.right': 1,
  'button.right.top': 3,
  'button.right.bottom': 0,
  'button.right.RT': 4,
  'button.right.RB': 7,

  'button.center.left': 8,
  'button.center.center': 16,
  'button.center.right': 9,
}

class XPad extends EventEmitter<XPadEvents> {
  gamepadId?: string

  get gamepad() {
    return navigator.getGamepads().find((n) => n?.id === this.gamepadId)
  }

  status = reactive({
    axis: {
      left: {
        button: ButtonStatus.released,
        x: 0,
        y: 0,
      },
      right: {
        button: ButtonStatus.released,
        x: 0,
        y: 0,
      },
    },
    buttons: {
      left: {
        left: ButtonStatus.released,
        right: ButtonStatus.released,
        top: ButtonStatus.released,
        bottom: ButtonStatus.released,
        LT: ButtonStatus.released,
        LB: ButtonStatus.released,
      },
      right: {
        left: ButtonStatus.released,
        right: ButtonStatus.released,
        top: ButtonStatus.released,
        bottom: ButtonStatus.released,
        RT: ButtonStatus.released,
        RB: ButtonStatus.released,
      },
      center: {
        left: ButtonStatus.released,
        center: ButtonStatus.released,
        right: ButtonStatus.released,
      },
    },
  })

  _reset() {
    throw new Error('Not implemented')
  }

  pollUpdate() {
    const _gamepad = this.gamepad

    if (!_gamepad) {
      this._reset()
      return
    }

    const _mapping = standardMapping

    for (const key of Object.keys(_mapping) as Array<keyof typeof _mapping>) {
      const isAxis = key.startsWith('axis.') && !key.endsWith('.button')

      const value = isAxis
        ? _gamepad.axes[_mapping[key]]
        : getButtonStatus(_gamepad.buttons[_mapping[key]])

      if (value != null) {
        this._updateStatus(key, value)
      }
    }
  }

  _updateStatus(key: string, value: number) {
    const keys = key.split('.')

    const oldValue = get(this.status, keys)

    if (oldValue === value) {
      return
    }

    set(this.status, keys, value)
    this.emit('onChange', key as keyof GamepadMapping, value)
  }
}

export interface GamepadOption {
  index?: number
}

function getButtonStatus(btn: GamepadButton): number | null {
  return btn.value > 0.7 ? ButtonStatus.pressed : btn.value < 0.1 ? ButtonStatus.released : null
}

export function useGamepad(opt: GamepadOption) {
  const pad = new XPad()

  useEventListener('gamepadconnected', (e) => {
    if (e.gamepad.index === opt.index) {
      pad.gamepadId = e.gamepad.id
      pad.emit('onConnected', e.gamepad)
    }
  })

  useEventListener('gamepaddisconnected', (e) => {
    if (e.gamepad.id === pad.gamepadId) {
      pad.gamepadId = undefined
      pad.emit('onDisconnected', e.gamepad)
    }
  })

  useRafFn(() => pad.pollUpdate())

  return pad
}
