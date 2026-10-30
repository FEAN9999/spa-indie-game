import type * as Phaser from 'phaser'

type Pointer = Phaser.Input.Pointer

/**
 * A mini-game's pointer events, one finger at a time: a press while another finger is down is ignored, and so are that
 * finger's moves and lift, until the first lifts. The pointer leaving the game lets go too.
 */
export function oneFinger(
  input: Phaser.Input.InputPlugin,
  on: { down?: (p: Pointer, over: Phaser.GameObjects.GameObject[]) => void; move?: (p: Pointer) => void; up?: () => void },
): void {
  let held: Pointer | null = null
  input.on('pointerdown', (p: Pointer, over: Phaser.GameObjects.GameObject[]) => {
    // a finger whose lift a scene above swallowed is no longer down
    if (held && held !== p && held.isDown) return
    held = p
    on.down?.(p, over)
  })
  input.on('pointermove', (p: Pointer) => {
    if (p === held) on.move?.(p)
  })
  for (const ev of ['pointerup', 'pointerupoutside']) {
    input.on(ev, (p: Pointer) => {
      if (p !== held) return
      held = null
      on.up?.()
    })
  }
  input.on('gameout', () => {
    held = null
    on.up?.()
  })
}
