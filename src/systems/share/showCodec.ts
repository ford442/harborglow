import { encode, decode } from '@msgpack/msgpack'
import type { ShowDocument } from '../../schemas/showDocument'

// =============================================================================
// SHOW CODEC — `"HGSH" | version byte | deflate-raw(msgpack(doc))`.
// The same bytes travel as a URL fragment (base64url, <= 8 KB) or a .hgshow file.
// Validation lives in schemas/showDocument.ts (lazy-loaded with valibot).
// =============================================================================

const MAGIC = [0x48, 0x47, 0x53, 0x48] as const // "HGSH"
const FORMAT_VERSION = 1
const HEADER_BYTES = MAGIC.length + 1

/** Longest URL fragment (including `hgshow=`) we will emit. */
export const SHARE_FRAGMENT_MAX = 8192
/** Inflate cap — guards against decompression bombs in untrusted links/files. */
export const MAX_INFLATED_BYTES = 1024 * 1024
export const FRAGMENT_KEY = 'hgshow'
const FILE_EXTENSION = '.hgshow'

export class ShowDecodeError extends Error {}

async function pump(input: Uint8Array, stream: CompressionStream | DecompressionStream, maxBytes: number): Promise<Uint8Array> {
  const writer = stream.writable.getWriter()
  // Errors surface through the reader; don't leave a dangling rejection.
  writer.write(input as BufferSource).then(() => writer.close()).catch(() => {})
  const reader = stream.readable.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > maxBytes) {
      await reader.cancel().catch(() => {})
      throw new ShowDecodeError('show is too large')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.length
  }
  return out
}

export function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new ShowDecodeError('link is not valid base64url')
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4)
  let bin: string
  try {
    bin = atob(padded)
  } catch {
    throw new ShowDecodeError('link is not valid base64url')
  }
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Serialize a show document (already schema-valid) into .hgshow bytes. */
export async function encodeShow(doc: ShowDocument): Promise<Uint8Array> {
  const packed = encode(doc)
  const deflated = await pump(packed, new CompressionStream('deflate-raw'), MAX_INFLATED_BYTES * 2)
  const out = new Uint8Array(HEADER_BYTES + deflated.length)
  out.set(MAGIC, 0)
  out[MAGIC.length] = FORMAT_VERSION
  out.set(deflated, HEADER_BYTES)
  return out
}

/**
 * Parse + validate .hgshow bytes. Throws ShowDecodeError (never anything
 * else) on any malformed, oversized or schema-invalid input.
 */
export async function decodeShow(bytes: Uint8Array): Promise<ShowDocument> {
  if (bytes.length <= HEADER_BYTES || MAGIC.some((b, i) => bytes[i] !== b)) {
    throw new ShowDecodeError('not a HarborGlow show')
  }
  if (bytes[MAGIC.length] !== FORMAT_VERSION) {
    throw new ShowDecodeError(`unsupported show version ${bytes[MAGIC.length]}`)
  }
  let raw: unknown
  try {
    const packed = await pump(bytes.subarray(HEADER_BYTES), new DecompressionStream('deflate-raw'), MAX_INFLATED_BYTES)
    raw = decode(packed)
  } catch (err) {
    if (err instanceof ShowDecodeError) throw err
    throw new ShowDecodeError('show data is corrupted')
  }
  const { parseShowDocument } = await import('../../schemas/showDocument')
  const result = parseShowDocument(raw)
  if (!result.ok) throw new ShowDecodeError(result.error.message)
  return result.doc
}

export type PackedShow =
  | { kind: 'fragment'; fragment: string; bytes: Uint8Array }
  | { kind: 'file'; filename: string; bytes: Uint8Array }

/** Fragment when it fits in SHARE_FRAGMENT_MAX, else a downloadable file. */
export async function packShow(doc: ShowDocument): Promise<PackedShow> {
  const bytes = await encodeShow(doc)
  const fragment = `${FRAGMENT_KEY}=${toBase64Url(bytes)}`
  if (fragment.length <= SHARE_FRAGMENT_MAX) return { kind: 'fragment', fragment, bytes }
  return { kind: 'file', filename: `${doc.shipType}${FILE_EXTENSION}`, bytes }
}
