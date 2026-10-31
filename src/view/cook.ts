import * as Phaser from 'phaser'
import { C } from '../art/palette'
import type { DishId, DishTicket } from '../sim/menu'
import type { PhoTicket } from '../sim/pho'
import { t, type StringKey } from '../strings/vi'
import type { MiniGameData } from './miniGame'
import { textStyle } from './text'

/** What a cook scene is opened with: a mini-game's data and the diner's ticket for that dish. */
export interface CookData<T extends DishTicket = DishTicket> extends MiniGameData {
  ticket: T
}

/** The scene each dish is cooked in. */
export const COOK_SCENE: Record<DishId, string> = { pho: 'PhoScene', banhXeo: 'BanhXeoScene', che: 'CheScene' }

/** The three step pills down the left, beside the ticket at the top right, and the ticket's lines. */
export const PILL = { x: 285, w: 370, h: 64, ys: [520, 600, 680], size: 34 }
const TICKET = { x: 520, y: 465, textX: 555, headY: 505, headSize: 30, lineY: 550, lineStep: 46, lineSize: 38 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** The lines written on a dish's ticket, top to bottom. */
export function ticketLines(dish: DishId, ticket: DishTicket): StringKey[] {
  if (dish === 'pho') {
    const tk = ticket as PhoTicket
    return [tk.doneness === 'tai' ? 'phoTai' : 'phoChin', tk.onion === 'little' ? 'phoOnionLittle' : 'phoOnionLots', tk.chili ? 'phoChili' : 'phoNoChili', tk.extraHerb ? 'phoExtraHerb' : 'phoHerbLine']
  }
  return []
}

/** The order ticket at the card's top right, with the dish's lines written on it. */
export function addTicket(scene: Phaser.Scene, dish: DishId, ticket: DishTicket): void {
  scene.add.image(TICKET.x, TICKET.y, 'pho-ticket').setOrigin(0)
  scene.add.text(TICKET.textX, TICKET.headY, t('phoTicket'), textStyle(TICKET.headSize, '800', C.terracotta)).setOrigin(0, 0.5)
  ticketLines(dish, ticket).forEach((key, i) => scene.add.text(TICKET.textX, TICKET.lineY + i * TICKET.lineStep, t(key), textStyle(TICKET.lineSize, '600')).setOrigin(0, 0.5))
}

/** Draws the three step pills down the left with their labels, and returns the redraw: steps before `at` teal, `at` mustard, the rest cream. */
export function addPills(scene: Phaser.Scene, labels: string[]): (at: number) => void {
  const pills = scene.add.graphics()
  const texts = labels.map((label, i) => scene.add.text(PILL.x, PILL.ys[i], label, textStyle(PILL.size)).setOrigin(0.5))
  return at => {
    pills.clear()
    labels.forEach((_, i) => {
      const fill = i < at ? C.teal : i === at ? C.mustard : C.cream
      const [x, y] = [PILL.x - PILL.w / 2, PILL.ys[i] - PILL.h / 2]
      pills.fillStyle(hex(fill), 1).fillRoundedRect(x, y, PILL.w, PILL.h, PILL.h / 2)
      pills.lineStyle(4, hex(C.ink)).strokeRoundedRect(x, y, PILL.w, PILL.h, PILL.h / 2)
      texts[i].setColor(i < at ? C.cream : i === at ? C.ink : C.soft)
    })
  }
}
