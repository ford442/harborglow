import { test } from '@playwright/test'
import {
  attachConsoleCollector,
  assertNoLevaControlsConfigErrors,
  bootGame,
} from './helpers'

test.describe('Scene boot', () => {
  test('New Game loads MainScene without LevaControlsConfig errors', async ({
    page,
  }) => {
    const collector = attachConsoleCollector(page)

    try {
      await bootGame(page)
      assertNoLevaControlsConfigErrors(collector.errors)
    } finally {
      collector.detach()
    }
  })
})
