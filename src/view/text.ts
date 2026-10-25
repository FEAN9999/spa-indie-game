import type * as Phaser from 'phaser'
import { C } from '../art/palette'

/** Be Vietnam Pro at one of the two preloaded weights; the test string measures stacked Vietnamese marks. */
export function textStyle(size: number, weight: '600' | '800' = '800', color: string = C.ink): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: '"Be Vietnam Pro"', fontStyle: weight, fontSize: `${size}px`, color, testString: '|MÉqgyẶỖ' }
}
