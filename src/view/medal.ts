import * as Phaser from 'phaser'
import { C } from '../art/palette'
import type { BadgeId } from '../sim/badges'
import { BADGE_ICON } from './badges'

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const R = 64
const INNER_R = 50
/** The not-got rim is drawn as dashes this long with gaps this long, since Phaser strokes have no dash. */
const DASH = 14
const GAP = 10
const RING_W = 9
const DIM_ALPHA = 0.55

/**
 * A badge's medal centred on x, y. A got one is a mustard disc with an ink icon; one not got yet is sand with a
 * dashed rim and a faded icon, and a teal arc from the top shows how far `ring` ([done, goal]) has come.
 */
export function addMedal(
  scene: Phaser.Scene,
  id: BadgeId,
  x: number,
  y: number,
  opts: { got: boolean; ring: [number, number] | null },
): Phaser.GameObjects.Container {
  const g = scene.add.graphics()
  const icon = scene.add.image(0, 0, BADGE_ICON[id])
  if (opts.got) {
    g.fillStyle(hex(C.mustard), 1).fillCircle(0, 0, R).lineStyle(5, hex(C.ink)).strokeCircle(0, 0, R)
    g.lineStyle(4, hex(C.mustardDark)).strokeCircle(0, 0, INNER_R)
    icon.setTint(hex(C.ink))
  } else {
    g.fillStyle(hex(C.sand), 1).fillCircle(0, 0, R).lineStyle(4, hex(C.ink))
    const dashes = Math.round((2 * Math.PI * R) / (DASH + GAP))
    const step = (2 * Math.PI) / dashes
    for (let i = 0; i < dashes; i++) {
      g.beginPath()
      g.arc(0, 0, R, i * step, i * step + (step * DASH) / (DASH + GAP))
      g.strokePath()
    }
    icon.setTint(hex(C.soft)).setAlpha(DIM_ALPHA)
    const k = opts.ring ? Math.min(0.999, opts.ring[0] / opts.ring[1]) : 0
    if (k > 0) {
      const from = -Math.PI / 2
      const to = from + k * 2 * Math.PI
      g.lineStyle(RING_W, hex(C.teal)).beginPath().arc(0, 0, R, from, to).strokePath()
      // round ends, as Phaser strokes have square ones
      g.fillStyle(hex(C.teal), 1).fillCircle(0, -R, RING_W / 2).fillCircle(Math.cos(to) * R, Math.sin(to) * R, RING_W / 2)
    }
  }
  return scene.add.container(x, y, [g, icon])
}
