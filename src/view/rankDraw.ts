import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { textStyle } from './text'

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

const DISC_X = 140
const DISC_R = 38
const ICON_W = 52
const TEXT_X = 200
const TEXT_W = 260
const BAR_X = 480
const BAR_W = 340
const BAR_H = 40
const PTS_X = 980

/** The points of a five-armed star centred on cx, cy with outer radius `r`. */
export function starPoints(cx: number, cy: number, r: number, inner = 0.45): Phaser.Math.Vector2[] {
  const pts: Phaser.Math.Vector2[] = []
  for (let k = 0; k < 10; k++) {
    const a = (Math.PI / 5) * k - Math.PI / 2
    const d = k % 2 === 0 ? r : r * inner
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * d, cy + Math.sin(a) * d))
  }
  return pts
}

/**
 * One of the grade's five parts from `top`: disc and icon, name, the shop's number, a bar out of 20 and the points.
 * `fill(k)` draws the bar's fill at k (0 to 1 of the 20 points); the bar starts empty.
 */
export function addPartRow(
  scene: Phaser.Scene,
  top: number,
  row: { icon: string; name: string; value: string; pts: number },
): { objects: Phaser.GameObjects.GameObject[]; fill: (k: number) => void } {
  const cy = top + 30
  const fit = (text: Phaser.GameObjects.Text) => text.setScale(Math.min(1, TEXT_W / text.width))
  const label = (x: number, y: number, text: string, size: number, weight: '600' | '800', color: string = C.ink) => scene.add.text(x, y, text, textStyle(size, weight, color)).setOrigin(0, 0.5)
  const disc = scene.add.graphics().fillStyle(hex(C.sand), 1).fillCircle(DISC_X, cy, DISC_R).lineStyle(4, hex(C.ink)).strokeCircle(DISC_X, cy, DISC_R)
  const icon = scene.add.image(DISC_X, cy, row.icon)
  icon.setScale(ICON_W / Math.max(icon.width, icon.height))
  const bar = scene.add
    .graphics()
    .fillStyle(hex(C.paper), 1)
    .fillRoundedRect(BAR_X, cy - BAR_H / 2, BAR_W, BAR_H, BAR_H / 2)
    .lineStyle(4, hex(C.ink))
    .strokeRoundedRect(BAR_X, cy - BAR_H / 2, BAR_W, BAR_H, BAR_H / 2)
  const fillG = scene.add.graphics()
  const pts = label(PTS_X, cy, `${row.pts}/20`, 32, '800').setOrigin(1, 0.5)
  const objects = [disc, icon, fit(label(TEXT_X, top + 8, row.name, 30, '800')), fit(label(TEXT_X, top + 48, row.value, 26, '600', C.soft)), bar, fillG, pts]
  const fill = (k: number) => {
    fillG.clear()
    if (k > 0) fillG.fillStyle(hex(C.teal), 1).fillRoundedRect(BAR_X + 4, cy - BAR_H / 2 + 4, Math.max(BAR_H - 8, (BAR_W - 8) * k), BAR_H - 8, (BAR_H - 8) / 2)
  }
  return { objects, fill }
}
