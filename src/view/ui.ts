import * as Phaser from 'phaser'
import { C } from '../art/palette'
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

/** A fully rounded button centred on x, y; primary is teal with paper text, plain is cream with ink text. */
export function addButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  kind: 'primary' | 'plain',
  onTap: () => void,
): Phaser.GameObjects.Container {
  const primary = kind === 'primary'
  const bg = scene.add
    .graphics()
    .fillStyle(hex(primary ? C.teal : C.cream), 1)
    .fillRoundedRect(-w / 2, -h / 2, w, h, h / 2)
    .lineStyle(4, hex(C.ink))
    .strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2)
  const text = scene.add.text(0, 0, label, textStyle(primary ? 56 : 44, '800', primary ? C.paper : C.ink)).setOrigin(0.5)
  return scene.add
    .container(x, y, [bg, text])
    .setSize(w, h)
    .setInteractive()
    .on('pointerup', onTap)
}
