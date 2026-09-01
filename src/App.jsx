import { useState } from 'react'
import MenuScreen from './screens/MenuScreen/MenuScreen'
import DifficultyScreen from './screens/DifficultyScreen/DifficultyScreen'
import OnlineScreen from './screens/OnlineScreen/OnlineScreen'
import ConfigScreen from './screens/ConfigScreen/ConfigScreen'
import GameScreen from './screens/GameScreen/GameScreen'
import { useSettings } from './app/useSettings'

let sessions = 0

/**
 * Screens before the board, controls behind the pause key. Nothing that
 * decides what kind of game this is can be reached once a game is running.
 */
export default function App() {
  const { settings, update, reset } = useSettings()
  const [screen, setScreen] = useState('menu')
  const [session, setSession] = useState(null)

  function start(next) {
    sessions += 1
    setSession({ id: sessions, ...next })
    setScreen('game')
  }

  function toMenu() {
    setSession(null)
    setScreen('menu')
  }

  if (screen === 'game' && session) {
    return (
      // Remounting on a new session is what guarantees a clean board, a clean
      // history and no leftover transport from the game before.
      <GameScreen
        key={session.id}
        session={session}
        settings={settings}
        onSettings={update}
        onExit={toMenu}
      />
    )
  }

  if (screen === 'difficulty') {
    return (
      <DifficultyScreen
        onStart={({ level, engineSide }) => start({ mode: 'engine', level, engineSide })}
        onBack={toMenu}
      />
    )
  }

  if (screen === 'online') {
    return (
      <OnlineScreen
        onStart={({ transport, side, label }) => start({ mode: 'online', transport, side, label })}
        onBack={toMenu}
      />
    )
  }

  if (screen === 'config') {
    return (
      <ConfigScreen settings={settings} onChange={update} onReset={reset} onBack={toMenu} />
    )
  }

  return (
    <MenuScreen
      onChoose={(choice) => {
        if (choice === 'local') start({ mode: 'local' })
        else if (choice === 'engine') setScreen('difficulty')
        else if (choice === 'online') setScreen('online')
        else setScreen('config')
      }}
    />
  )
}
