import type * as Phaser from 'phaser'
import { describe, expect, it } from 'vitest'
import { oneFinger } from '../../src/view/oneFinger'

/** oneFinger on a stand-in input that keeps its handlers, logging what reaches the scene. */
function make() {
  const handlers = new Map<string, (...a: unknown[]) => void>()
  const input = { on: (ev: string, fn: (...a: unknown[]) => void) => handlers.set(ev, fn) }
  const log: string[] = []
  oneFinger(input as unknown as Phaser.Input.InputPlugin, {
    down: p => log.push(`down ${p.id}`),
    move: p => log.push(`move ${p.id}`),
    up: () => log.push('up'),
  })
  const emit = (ev: string, p: unknown) => handlers.get(ev)!(p, [])
  return { log, emit }
}

describe('one finger at a time', () => {
  it('ignores a second finger’s press, moves and lift until the first lifts, then follows the next press', () => {
    const { log, emit } = make()
    const a = { id: 1, isDown: true }
    const b = { id: 2, isDown: true }
    emit('pointerdown', a)
    emit('pointerdown', b)
    emit('pointermove', b)
    emit('pointermove', a)
    b.isDown = false
    emit('pointerup', b)
    a.isDown = false
    emit('pointerup', a)
    b.isDown = true
    emit('pointerdown', b)
    emit('pointermove', b)
    emit('pointerupoutside', b)
    expect(log).toEqual(['down 1', 'move 1', 'up', 'down 2', 'move 2', 'up'])
  })

  it('lets go when the pointer leaves the game, and takes a press after a lift it never saw', () => {
    const { log, emit } = make()
    const a = { id: 1, isDown: true }
    emit('pointerdown', a)
    emit('gameout', 1234)
    emit('pointermove', a)
    emit('pointerdown', a)
    // lifted over a scene above: the next finger is followed
    a.isDown = false
    const b = { id: 2, isDown: true }
    emit('pointerdown', b)
    expect(log).toEqual(['down 1', 'up', 'down 1', 'down 2'])
  })
})
