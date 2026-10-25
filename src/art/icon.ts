import { C } from './palette'
import { GACH_BONG_TILE } from './room'
import { svgDoc } from './svg'

/**
 * The home-screen icon: one gạch bông tile filling the square, its flower outlined in ink.
 * The flower spans 4.5–19.5 of 24 units, inside the central 80% a maskable icon keeps.
 */
export function appIconSvg(size: number): string {
  return svgDoc([0, 0, 24, 24], size / 24, `<style>.flower{stroke:${C.ink};stroke-width:0.5;stroke-linejoin:round}</style>${GACH_BONG_TILE}`)
}
