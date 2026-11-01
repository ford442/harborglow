import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEditorSession, type EditorSession } from '../../systems/lightShows/editor/editorSession'
import { resetUserShowsMemory } from '../../systems/lightShows/userShows'
import Toolbar from './Toolbar'

let session: EditorSession | null = null
afterEach(() => {
  session?.dispose()
  session = null
  resetUserShowsMemory()
  vi.restoreAllMocks()
})

describe('Toolbar (server render smoke)', () => {
  it('renders every control for a freshly forked show', () => {
    session = createEditorSession({ shipType: 'cruise', shipId: 'c1' })
    const html = renderToString(<Toolbar session={session} />).replace(/<!-- -->/g, '')
    for (const id of ['le-play', 'le-undo', 'le-redo', 'le-pattern', 'le-easing', 'le-intensity', 'le-length', 'le-loop', 'le-copybar', 'le-reset', 'le-save']) {
      expect(html, id).toContain(`data-testid="${id}"`)
    }
    for (const text of ['breathe', 'easeInOut', '1/4', '1/8', '1/16', 'free', 'Quantize', 'Fork factory']) expect(html).toContain(text)
    expect(html).toContain('● Save') // an unsaved fork is dirty
    expect(html).not.toContain('Delete mine') // nothing saved yet
  })

  it('offers the ship colour and the show colours as swatches', () => {
    session = createEditorSession({ shipType: 'cruise', shipId: 'c1' })
    const html = renderToString(<Toolbar session={session} />)
    expect(html).toContain('aria-label="colour #ffd700"') // the finale's gold
    expect(html).toContain('aria-label="colour #ffffff"')
  })

  it('starts with undo/redo disabled and Play offered', () => {
    session = createEditorSession({ shipType: 'cruise', shipId: 'c1' })
    const html = renderToString(<Toolbar session={session} />)
    expect(html).toContain('▶ Play')
    // zustand renders its initial snapshot on the server, so live state (playing,
    // history) is covered by the browser-driven e2e rather than here.
    const undo = /<button[^>]*data-testid="le-undo"[^>]*>/.exec(html)?.[0] ?? ''
    expect(undo).toContain('disabled')
  })
})
