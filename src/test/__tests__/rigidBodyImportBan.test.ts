import { describe, expect, it } from 'vitest'
import { ESLint } from 'eslint'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const filePath = 'src/scenes/rigidBodyFixture.tsx'

async function lint(code: string) {
  const eslint = new ESLint({ cwd: repoRoot })
  const results = await eslint.lintText(code, { filePath })
  expect(results.length).toBe(1)
  return results[0]!.messages.filter((m) => m.ruleId === 'no-restricted-imports')
}

describe('RigidBody import ban (PR #273)', () => {
  it('flags RigidBody imported from @react-three/rapier', async () => {
    const msgs = await lint(`import { RigidBody } from '@react-three/rapier'\nexport const X = RigidBody\n`)
    expect(msgs).toHaveLength(1)
    expect(msgs[0]!.message).toMatch(/rapier/)
  }, 30_000)

  it('allows the SafeRigidBody wrapper and other rapier exports', async () => {
    const msgs = await lint(
      `import { RigidBody } from './physics/SafeRigidBody'\nimport { CuboidCollider } from '@react-three/rapier'\nexport const X = [RigidBody, CuboidCollider]\n`,
    )
    expect(msgs).toHaveLength(0)
  }, 30_000)
})
