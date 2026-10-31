import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { TAP_SLOP_PX } from '../config'
import { textStyle } from './text'

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** A paper card with the ink outline, like the end-of-day summary. */
export function addCard(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.Graphics {
  return scene.add
    .graphics()
    .fillStyle(hex(C.paper), 1)
    .fillRoundedRect(x, y, w, h, 60)
    .lineStyle(4, hex(C.ink))
    .strokeRoundedRect(x, y, w, h, 60)
}

/**
 * Calls `fn` when a press on `obj` lifts on it: the same pointer, the same press, moved no more than TAP_SLOP_PX. A swipe or a
 * pinch that only ends over it, which Phaser also reports as its pointerup, never fires it.
 */
export function whenTapped<T extends Phaser.GameObjects.GameObject>(obj: T, fn: (p: Phaser.Input.Pointer) => void): T {
  let press = { id: -1, at: -1 }
  obj.on('pointerdown', (p: Phaser.Input.Pointer) => (press = { id: p.id, at: p.downTime }))
  obj.on('pointerup', (p: Phaser.Input.Pointer) => {
    if (p.id !== press.id || p.downTime !== press.at || Phaser.Math.Distance.Between(p.downX, p.downY, p.upX, p.upY) > TAP_SLOP_PX) return
    fn(p)
  })
  return obj
}

/** A fully rounded button centred on x, y; primary is teal with paper text, plain is cream with ink text. `size` overrides the label size. */
export function addButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  kind: 'primary' | 'plain',
  onTap: () => void,
  size?: number,
): Phaser.GameObjects.Container {
  const primary = kind === 'primary'
  const bg = scene.add
    .graphics()
    .fillStyle(hex(primary ? C.teal : C.cream), 1)
    .fillRoundedRect(-w / 2, -h / 2, w, h, h / 2)
    .lineStyle(4, hex(C.ink))
    .strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2)
  const text = scene.add.text(0, 0, label, textStyle(size ?? (primary ? 56 : 44), '800', primary ? C.paper : C.ink)).setOrigin(0.5)
  const button = scene.add.container(x, y, [bg, text]).setSize(w, h).setInteractive()
  return whenTapped(button, () => {
    sound.play('tap')
    onTap()
  })
}

/** A dark pill with paper text centred on x, y that fades in, stays 1.7 seconds and fades out, then destroys itself. */
export function addToast(scene: Phaser.Scene, x: number, y: number, text: string, wrapWidth = 920): Phaser.GameObjects.Container {
  const label = scene.add.text(0, 0, text, { ...textStyle(40, '600', C.paper), align: 'center', wordWrap: { width: wrapWidth } }).setOrigin(0.5)
  // one line keeps the old 80 tall box (the font's tall-mark metrics would make label.height + 40 taller); wrapped lines grow it
  const h = label.getWrappedText().length > 1 ? Math.max(80, label.height + 40) : 80
  const bg = scene.add.graphics().fillStyle(hex(C.ink), 0.92).fillRoundedRect(-label.width / 2 - 40, -h / 2, label.width + 80, h, Math.min(40, h / 2))
  const box = scene.add.container(x, y, [bg, label]).setAlpha(0)
  scene.tweens.chain({
    targets: box,
    tweens: [
      { alpha: 1, duration: 150 },
      { alpha: 0, delay: 1700, duration: 150 },
    ],
    onComplete: () => box.destroy(),
  })
  return box
}
