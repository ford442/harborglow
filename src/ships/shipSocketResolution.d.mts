export declare const SHIP_ATTACH_PREFIX: 'attach_'
export declare function socketCandidateNames(
  attachmentId: string,
  socketMap?: Record<string, string>,
): string[]
export declare function resolveSocketName(
  attachmentId: string,
  availableNames: Iterable<string>,
  socketMap?: Record<string, string>,
): string | null
