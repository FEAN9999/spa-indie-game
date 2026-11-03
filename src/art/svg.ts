import * as Phaser from 'phaser'

/** An SVG document whose viewBox units are drawn at `pxPerUnit` canvas pixels. */
export function svgDoc(viewBox: [number, number, number, number], pxPerUnit: number, body: string): string {
  const [x, y, w, h] = viewBox
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(w * pxPerUnit)}" height="${Math.ceil(h * pxPerUnit)}" viewBox="${x} ${y} ${w} ${h}">${body}</svg>`
}

const svgUrl = (svg: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)

/**
 * Puts every SVG not yet a texture on the scene's loader. Called from a scene's preload, the scene is created once they are all
 * ready, so a close-up's pictures are made the first time it opens instead of at boot.
 */
export function preloadSvgTextures(scene: Phaser.Scene, defs: Record<string, string>): void {
  for (const [key, svg] of Object.entries(defs)) if (!scene.textures.exists(key)) scene.load.image(key, svgUrl(svg))
}

/** Adds every SVG as a texture; resolves once all are ready (failures are logged, not fatal). */
export function loadSvgTextures(scene: Phaser.Scene, defs: Record<string, string>): Promise<void> {
  const textures = scene.textures
  const pending = new Set(Object.keys(defs).filter(k => !textures.exists(k)))
  if (pending.size === 0) return Promise.resolve()

  return new Promise(resolve => {
    const done = (key: string) => {
      if (!pending.delete(key)) return
      if (pending.size > 0) return
      textures.off(Phaser.Textures.Events.ADD, done)
      textures.off(Phaser.Textures.Events.ERROR, failed)
      resolve()
    }
    const failed = (key: string) => {
      console.error(`SVG texture failed to load: ${key}`)
      done(key)
    }
    textures.on(Phaser.Textures.Events.ADD, done)
    textures.on(Phaser.Textures.Events.ERROR, failed)
    for (const key of [...pending]) textures.addBase64(key, svgUrl(defs[key]))
  })
}
