'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULTS } from '@/lib/settings'

type SettingsMap = Record<string, string>
type LoadState = 'loading' | 'loaded' | 'cached' | 'error'

const CACHE_KEY = 'autosupply_settings'
const CACHE_TTL = 10 * 60 * 1000 // 10 min

const Ctx = createContext<{ settings: SettingsMap; state: LoadState }>({
  settings: {},
  state: 'loading',
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsMap>({})
  const [state, setState] = useState<LoadState>('loading')

  useEffect(() => {
    // Warm from cache first so the UI is instant on repeat loads.
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const { ts, data } = JSON.parse(raw)
        if (Date.now() - ts < CACHE_TTL) {
          setSettings(data)
          setState('cached')
        }
      }
    } catch {}

    // Then fetch fresh public settings.
    const supabase = createClient()
    supabase
      .from('settings')
      .select('key,value')
      .eq('is_public', true)
      .then(({ data, error }) => {
        if (error || !data) {
          setState((s) => (s === 'cached' ? 'cached' : 'error'))
          return
        }
        const map: SettingsMap = {}
        data.forEach((r: { key: string; value: string | null }) => {
          map[r.key] = r.value ?? ''
        })
        setSettings(map)
        setState('loaded')
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: map }))
        } catch {}
      })
  }, [])

  return <Ctx.Provider value={{ settings, state }}>{children}</Ctx.Provider>
}

export function useSettings() {
  return useContext(Ctx).settings
}

export function useSetting(key: string, fallback = '') {
  const { settings } = useContext(Ctx)
  return settings[key] ?? DEFAULTS[key] ?? fallback
}

export function invalidateSettingsCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {}
}
