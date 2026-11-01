// =============================================================================
// USER SHOWS — leaf module (type-only imports) so editorModel and the resolver
// in lightShows/index.ts can share the id convention. Persistence is added in
// phase 2 below the id helper.
// =============================================================================

import type { ShipType } from '../../store/gameStoreTypes'

/** A player's forked show for `shipType` always carries this id. */
export function userShowId(shipType: ShipType): string {
  return `${shipType}-user`
}
