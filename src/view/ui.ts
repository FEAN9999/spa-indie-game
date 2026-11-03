import * as Phaser from 'phaser'
import { shade } from '../art/aplus'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { TAP_SLOP_PX } from '../config'
import { textStyle } from './text'

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/**
 * A rounded frame in A+, drawn into `g`: an 18% ink shadow cast to its lower right, the fill with its hard-edged shade
 * along the bottom and right, a thin white shine inside the top left, then the `line` wide `edge` outline. Returns `g`.
 */
export function aplusFrame(
  g: Phaser.GameObjects.Graphics,
  fill: string,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | Phaser.Types.GameObjects.Graphics.RoundedRectRadius,
  line = 4,
  edge: string = C.ink,
): Phaser.GameObjects.Graphics {
  const d = Phaser.Math.Clamp(Math.min(w, h) * 0.08, 3, 8)
  const cap = (v = 0) => Math.min(v, (w - d) / 2, (h - d) / 2)
  const inner = typeof r === 'number' ? cap(r) : { tl: cap(r.tl), tr: cap(r.tr), bl: cap(r.bl), br: cap(r.br) }
  const corner = typeof inner === 'number' ? inner : inner.tl
  g.fillStyle(hex(C.ink), 0.18).fillRoundedRect(x + d, y + d, w, h, r)
  g.fillStyle(hex(shade(fill)), 1).fillRoundedRect(x, y, w, h, r)
  g.fillStyle(hex(fill), 1).fillRoundedRect(x, y, w - d, h - d, inner)
  if (w >= 60 && h >= 36) g.fillStyle(0xffffff, 0.45).fillRoundedRect(x + Math.max(corner * 0.6, 12), y + Math.max(6, corner * 0.12), Math.min(w * 0.22, 160), 6, 3)
  return g.lineStyle(line, hex(edge)).strokeRoundedRect(x, y, w, h, r)
}

/** A paper card with the ink outline, like the end-of-day summary. */
export function addCard(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.Graphics {
  return aplusFrame(scene.add.graphics(), C.paper, x, y, w, h, 60)
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
  const bg = aplusFrame(scene.add.graphics(), primary ? C.teal : C.cream, -w / 2, -h / 2, w, h, h / 2)
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
