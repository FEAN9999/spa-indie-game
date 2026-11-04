/** Whether the depths never go down along the list, so sorting it by depth would change nothing. */
export function inDepthOrder(list: readonly { _depth: number }[]): boolean {
  for (let i = 1; i < list.length; i++) if (list[i - 1]._depth > list[i]._depth) return false
  return true
}
