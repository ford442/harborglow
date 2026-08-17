export interface InputLogEntry {
  tick: number
  action: string
  payload: unknown
}

export interface ReplayFile {
  version: 1
  seed: number
  dt: number
  inputs: InputLogEntry[]
}

export function serializeReplay(file: ReplayFile): string {
  return `${JSON.stringify(file)}\n`
}

export function parseReplay(json: string): ReplayFile {
  const parsed = JSON.parse(json) as ReplayFile
  if (parsed.version !== 1 || typeof parsed.seed !== 'number' || !Array.isArray(parsed.inputs)) {
    throw new Error('Invalid replay file')
  }
  return parsed
}
