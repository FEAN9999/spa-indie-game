import * as Phaser from 'phaser'

/**
 * The layer that stays put over the zooming map: the top bar, floor buttons, nav, cards and shutter the shop draws into it.
 * It has no logic of its own; it runs from boot on, under every panel scene, and the shop clears it when it shuts down.
 */
export class HudScene extends Phaser.Scene {
  constructor() {
    super('HudScene')
  }

  /** Takes down everything the shop drew here, with its tweens and timers. */
  clear(): void {
    this.tweens.killAll()
    this.time.removeAllEvents().clearPendingEvents()
    for (const o of [...this.children.list]) o.destroy()
  }
}
