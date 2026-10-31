/** Each texture's lamps, in its own tiles from its top-left (mirrored when it is flipped), with the glow's scale. */
export const LAMPS: Record<string, { x: number; y: number; s: number }[]> = {
  lantern: [{ x: 0.5, y: 0.55, s: 0.6 }],
  nailDesk: [{ x: 0.42, y: 1.42, s: 0.5 }],
  'nailDesk-turned': [{ x: 1.84, y: 1.44, s: 0.5 }],
  bambooLamp: [{ x: 0.5, y: 0.56, s: 0.7 }],
  'decor-lanternString': [0.51, 1.31, 2.11].map(y => ({ x: 0.62, y, s: 0.4 })),
  'decor-stoneLamp': [{ x: 0.5, y: 0.76, s: 0.6 }],
  'decor-candleShelf': [{ x: 0.26, y: 0.68, s: 0.35 }, { x: 0.46, y: 0.78, s: 0.35 }],
  'decor-wallLantern': [{ x: 0.62, y: 0.86, s: 0.7 }],
}
