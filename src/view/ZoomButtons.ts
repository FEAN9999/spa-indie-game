import type * as Phaser from 'phaser'
import { addButton } from './ui'

const SIZE = 92

/** The + and − buttons at the map's right edge; a tap zooms one step in or out. */
export class ZoomButtons {
  private parts: Phaser.GameObjects.Container[] = []
  /** Where the pair on screen was put, so an unchanged frame does nothing. */
  private at = ''

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly depth: number,
    private readonly onZoom: (dir: 1 | -1) => void,
  ) {}

  show(x: number, plusY: number, minusY: number): void {
    const key = `${x}|${plusY}|${minusY}`
    if (key === this.at) return
    this.hide()
    this.at = key
    this.parts = [
      addButton(this.scene, x, plusY, SIZE, SIZE, '+', 'plain', () => this.onZoom(1), 56),
      addButton(this.scene, x, minusY, SIZE, SIZE, '−', 'plain', () => this.onZoom(-1), 56),
    ]
    for (const p of this.parts) p.setDepth(this.depth)
  }

  hide(): void {
    for (const p of this.parts) p.destroy()
    this.parts = []
    this.at = ''
  }
}
