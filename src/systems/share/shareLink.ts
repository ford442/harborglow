import { FRAGMENT_KEY } from './showCodec'

// =============================================================================
// SHARE LINK — read/clear/build the `#hgshow=<base64url>` URL fragment.
// The fragment never reaches a server; opening it boots straight into playback.
// =============================================================================

/** The raw base64url payload from the current URL fragment, or null if none. */
export function readShareFragment(hash: string = window.location.hash): string | null {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const value = params.get(FRAGMENT_KEY)
  return value ? value : null
}

/** Drop the fragment (kept query intact) so a reload doesn't re-open the link. */
export function clearShareFragment(): void {
  const { pathname, search } = window.location
  window.history.replaceState(window.history.state, '', `${pathname}${search}`)
}

export function buildShareUrl(fragment: string, loc: Pick<Location, 'origin' | 'pathname'> = window.location): string {
  return `${loc.origin}${loc.pathname}#${fragment}`
}
