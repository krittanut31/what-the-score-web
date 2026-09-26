import { useEffect, useState } from 'react'
import {
  addRally, canUndo, newMatch, startNextGame, summarize, undoRally, type Config, type Match,
} from './logic'
import { MatchScreen } from './components/MatchScreen'
import { ResultScreen } from './components/ResultScreen'
import { Setup } from './components/Setup'

type Screen = 'setup' | 'match'

interface Saved {
  screen: Screen
  /** Settings being edited on the setup screen. */
  config: Config
  /** The match in play, with the settings it was started with. */
  active: { config: Config; match: Match } | null
}

const STORAGE_KEY = 'what-the-score:v1'

const defaultConfig: Config = {
  mode: 'doubles',
  teams: [
    { name: '', players: ['', ''] },
    { name: '', players: ['', ''] },
  ],
  points: 21,
  bestOf: 1,
  firstServer: 0,
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Saved
      if (saved.config?.teams?.length === 2 && (saved.active === null || Array.isArray(saved.active?.match?.games))) {
        return { ...saved, screen: saved.active ? saved.screen : 'setup' }
      }
    }
  } catch {
    // Storage unavailable or corrupt: start fresh.
  }
  return { screen: 'setup', config: defaultConfig, active: null }
}

export function App() {
  const [state, setState] = useState<Saved>(load)
  const { screen, config, active } = state

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore: the app still works without persistence.
    }
  }, [state])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  const update = (fn: (m: Match) => Match) =>
    setState((s) => (s.active ? { ...s, active: { ...s.active, match: fn(s.active.match) } } : s))

  const start = () => setState((s) => ({ ...s, screen: 'match', active: { config: s.config, match: newMatch() } }))

  if (screen === 'match' && active) {
    const props = active
    if (summarize(active.config, active.match).matchWinner !== null) {
      return (
        <ResultScreen
          {...props}
          onRematch={() => update(newMatch)}
          onUndo={() => update(undoRally)}
          onSetup={() => setState((s) => ({ ...s, screen: 'setup', active: null }))}
        />
      )
    }
    return (
      <MatchScreen
        {...props}
        onPoint={(t) => update((m) => addRally(m, t))}
        onUndo={() => update(undoRally)}
        onNextGame={() => update(startNextGame)}
        onSwap={() => update((m) => ({ ...m, swapped: !m.swapped }))}
        onBack={() => setState((s) => ({ ...s, screen: 'setup' }))}
      />
    )
  }

  const resumable =
    active !== null && canUndo(active.match) && summarize(active.config, active.match).matchWinner === null

  return (
    <Setup
      config={config}
      onChange={(c) => setState((s) => ({ ...s, config: c }))}
      onStart={start}
      onResume={resumable ? () => setState((s) => ({ ...s, screen: 'match' })) : null}
    />
  )
}
