import { SERVICE_OPEN_COST, SERVICE_PRICE } from '../config'
import type { StringKey } from '../strings/vi'
import type { ItemKind } from './items'

export type ServiceId = 'shampoo' | 'mask' | 'massage'

/** Every service, which is also the order they open in. */
export const SERVICE_IDS: ServiceId[] = ['shampoo', 'mask', 'massage']

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
}

/** The service a kind of bed gives, or null for other furniture. */
export function serviceOfBed(kind: ItemKind): ServiceId | null {
  return SERVICE_IDS.find(id => SERVICES[id].bed === kind) ?? null
}

/** What stops a service opening now: money is negative, there is not enough, or an earlier service is still closed. */
export type ServiceProblem = 'debt' | 'money' | 'order'
