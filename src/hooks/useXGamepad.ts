import { GamepadController } from '@/lib/gamepad'
import { remove } from '@0x-jerry/utils'

export interface UseGamepadOption {
  connect(x: VirtualGamepad): void
  disconnect?(x: VirtualGamepad): void
}

interface VirtualGamepad {
  id: string
  controller: GamepadController
}

export function useXGamepad(opt: UseGamepadOption) {
  const gamepads: VirtualGamepad[] = []

  useEventListener('gamepadconnected', (e) => gamepadHandler(e, true))
  useEventListener('gamepaddisconnected', (e) => gamepadHandler(e, false))

  onUnmounted(() => gamepads.forEach((item) => item.controller.dispose()))

  return gamepads

  function gamepadHandler(event: GamepadEvent, connecting: boolean) {
    const gamepad = event.gamepad

    if (connecting) {
      const c = new GamepadController(gamepad.id)
      const vg = {
        id: gamepad.id,
        controller: c,
      }
      gamepads.push(vg)

      opt.connect(vg)
      return
    }

    const vg = gamepads.find((n) => n.id === gamepad.id)
    if (!vg) return

    vg.controller.dispose()

    remove(gamepads, vg)

    opt.disconnect?.(vg)
  }
}
