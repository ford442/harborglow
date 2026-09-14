// =============================================================================
// SHIP SOCKET RESOLUTION — the ONE definition of how a blueprint attachment id
// binds to a GLB node name.
//
// Consumed by both sides of the contract so they cannot drift:
//   - runtime: src/ships/extractAttachmentPoints.ts (resolves against a scene)
//   - build gate: scripts/verify-ship-glb.mjs (resolves against glTF JSON)
//
// Plain .mjs (with an adjacent .d.mts) because the verifier is a dependency-free
// node script that must not need a TypeScript runtime.
// =============================================================================

/** Prefix for optional attachment empties (both `stack1` and `attach_stack1` resolve). */
export const SHIP_ATTACH_PREFIX = 'attach_'

/**
 * Candidate GLB node names for a blueprint attachment id, most specific first:
 *   1. every node name the blueprint's `attachmentSocketMap` points at this id
 *   2. a node named exactly `<attachmentId>`
 *   3. a node named `attach_<attachmentId>`
 *
 * @param {string} attachmentId
 * @param {Record<string, string>} [socketMap] GLB node name → blueprint attachment id
 * @returns {string[]}
 */
export function socketCandidateNames(attachmentId, socketMap = {}) {
  const candidates = []
  for (const [nodeName, mappedId] of Object.entries(socketMap)) {
    if (mappedId === attachmentId) candidates.push(nodeName)
  }
  candidates.push(attachmentId, `${SHIP_ATTACH_PREFIX}${attachmentId}`)
  return candidates
}

/**
 * First candidate name that exists in `availableNames`, or null when the
 * attachment cannot be bound at all.
 *
 * @param {string} attachmentId
 * @param {Iterable<string>} availableNames node names present in the model
 * @param {Record<string, string>} [socketMap]
 * @returns {string | null}
 */
export function resolveSocketName(attachmentId, availableNames, socketMap = {}) {
  const present = availableNames instanceof Set ? availableNames : new Set(availableNames)
  for (const candidate of socketCandidateNames(attachmentId, socketMap)) {
    if (present.has(candidate)) return candidate
  }
  return null
}
