import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('muxer chunk', () => {
  it('imports mediabunny only from the lazy show muxer', () => {
    const hits: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === '__tests__') continue
          walk(path)
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          const text = readFileSync(path, 'utf8')
          if (text.includes("from 'mediabunny'") || text.includes('from \"mediabunny\"')) hits.push(path)
        }
      }
    }
    walk('src')
    expect(hits.map((path) => path.replaceAll('\\', '/'))).toEqual(['src/systems/export/showMuxer.ts'])
  })
})
