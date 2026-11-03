import { parseLayout, type Grid } from '../sim/grid'
import { BRANCH_ROOM, type PlaceId } from '../sim/places'
import { beachRoomTexture } from './beach'
import { branchFloorTextures } from './branchFloors'
import { branchHouseTextures } from './branchHouses'
import { oldTownRoomTexture } from './oldTown'
import { uptownRoomTexture } from './uptown'

const ROOM: Record<PlaceId, (grid: Grid) => string> = { beach: beachRoomTexture, oldTown: oldTownRoomTexture, uptown: uptownRoomTexture }

/** The textures only the branch at `place` shows, its room on every floor and the houses beside it, by the keys RoomView asks for. */
export function branchTextures(place: PlaceId): Record<string, string> {
  const grid = parseLayout(BRANCH_ROOM)
  const all = { [`room-${place}`]: ROOM[place](grid), ...branchFloorTextures(), ...branchHouseTextures(grid) }
  return Object.fromEntries(Object.entries(all).filter(([key]) => key.startsWith(`room-${place}`) || key.startsWith(`house-${place}-`) || key === `sale-${place}`))
}
