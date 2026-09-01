import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './settings'

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const update = useCallback((patch) => {
    setSettings((current) => ({ ...current, ...patch }))
  }, [])

  const reset = useCallback(() => setSettings({ ...DEFAULT_SETTINGS }), [])

  return { settings, update, reset }
}
