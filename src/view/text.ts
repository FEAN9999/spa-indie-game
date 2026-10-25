import type * as Phaser from 'phaser'
import { C } from '../art/palette'

/** Baloo 2 at one of the two preloaded weights. */
export function textStyle(size: number, weight: '500' | '700' = '700', color: string = C.text): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: '"Baloo 2"', fontStyle: weight, fontSize: `${size}px`, color }
}
