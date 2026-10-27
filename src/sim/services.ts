import { SERVICE_OPEN_COST, SERVICE_PRICE } from '../config'
import type { StringKey } from '../strings/vi'
import type { ItemKind } from './items'
import type { RecipeId } from './recipes'

/** The first three services, which open one after another. */
export type BasicService = 'shampoo' | 'mask' | 'massage'
/** A service opened by solving its recipe at the bench. */
export type RecipeService = RecipeId
export type ServiceId = BasicService | RecipeService

/** The basic services in the order they open. */
export const BASIC_SERVICES: readonly BasicService[] = ['shampoo', 'mask', 'massage']
/** The recipe services, which open in any order once massage is open. */
export const RECIPE_SERVICES: readonly RecipeService[] = ['steam', 'stone', 'mud']

/** Every service: the basic ones, then the recipe ones. */
export const SERVICE_IDS: ServiceId[] = [...BASIC_SERVICES, ...RECIPE_SERVICES]

export const isRecipeService = (id: ServiceId): id is RecipeService => (RECIPE_SERVICES as readonly ServiceId[]).includes(id)

export interface ServiceSpec {
  /** What a customer pays. */
  price: number
  /** What opening it costs. */
  openCost: number
  /** The kind of bed it is given on. */
  bed: ItemKind
  name: StringKey
  /** The toast when every bed of this service is taken. */
  busy: StringKey
}

export const SERVICES: Record<ServiceId, ServiceSpec> = {
  shampoo: { price: SERVICE_PRICE.shampoo, openCost: SERVICE_OPEN_COST.shampoo, bed: 'bed', name: 'serviceShampoo', busy: 'stationsBusy' },
  mask: { price: SERVICE_PRICE.mask, openCost: SERVICE_OPEN_COST.mask, bed: 'maskBed', name: 'serviceMask', busy: 'busyMask' },
  massage: { price: SERVICE_PRICE.massage, openCost: SERVICE_OPEN_COST.massage, bed: 'massageBed', name: 'serviceMassage', busy: 'busyMassage' },
  steam: { price: SERVICE_PRICE.steam, openCost: SERVICE_OPEN_COST.steam, bed: 'steamTent', name: 'serviceSteam', busy: 'busySteam' },
  stone: { price: SERVICE_PRICE.stone, openCost: SERVICE_OPEN_COST.stone, bed: 'stoneBed', name: 'serviceStone', busy: 'busyStone' },
  mud: { price: SERVICE_PRICE.mud, openCost: SERVICE_OPEN_COST.mud, bed: 'mudTub', name: 'serviceMud', busy: 'busyMud' },
}

/** The service a kind of bed gives, or null for other furniture. */
export function serviceOfBed(kind: ItemKind): ServiceId | null {
  return SERVICE_IDS.find(id => SERVICES[id].bed === kind) ?? null
}

/** What stops a service opening now: money is negative, there is not enough, an earlier service is still closed, or its recipe is not solved yet. */
export type ServiceProblem = 'debt' | 'money' | 'order' | 'recipe'
