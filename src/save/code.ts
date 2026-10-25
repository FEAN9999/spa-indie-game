import { parseSave, SaveError, type SaveData } from '../sim/save'

const PREFIX = 'SPA1.'

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream))
  return new Uint8Array(await out.arrayBuffer())
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(bin, ch => ch.charCodeAt(0))
}

/** A short code to paste into a chat or a note: "SPA1." and the compressed shop. */
export async function encodeSaveCode(data: SaveData): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(data))
  return PREFIX + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))
}

/** Reads a code back, ignoring the line breaks and spaces chat apps add; SaveError when it is not a save code. */
export async function decodeSaveCode(code: string): Promise<SaveData> {
  const clean = code.replace(/\s+/g, '')
  if (!clean.startsWith(PREFIX) || clean.length === PREFIX.length) throw new SaveError('not a save code')
  try {
    const json = await pipe(fromBase64Url(clean.slice(PREFIX.length)), new DecompressionStream('deflate-raw'))
    return parseSave(JSON.parse(new TextDecoder().decode(json)))
  } catch (e) {
    throw e instanceof SaveError ? e : new SaveError('not a save code')
  }
}
