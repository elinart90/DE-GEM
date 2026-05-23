'use client'
import { useEffect, useMemo, useState } from 'react'
import { getAllSettings, updateSettings, type Setting } from '@/lib/settings'
import { invalidateSettingsCache } from '@/components/SettingsProvider'
import {
  Building2, CreditCard, Truck, Settings as Cog, Save, AlertCircle,
  Loader2, Globe, Lock,
} from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORY_META: Record<string, { label: string; icon: any }> = {
  business: { label: 'Business', icon: Building2 },
  payment:  { label: 'Payment',  icon: CreditCard },
  delivery: { label: 'Delivery', icon: Truck },
}

export default function SettingsPage() {
  const [rows, setRows] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState<Record<string, string>>({})
  const [active, setActive] = useState<string>('business')

  useEffect(() => {
    getAllSettings()
      .then((data) => {
        setRows(data)
        if (data.length) {
          const first = data.find((d) => d.category)?.category || 'business'
          setActive(first)
        }
      })
      .catch(() => toast.error('Could not load settings'))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.category || 'other'))
    return Array.from(set)
  }, [rows])

  const visible = rows.filter((r) => (r.category || 'other') === active)

  function valueOf(s: Setting) {
    return dirty[s.key] ?? s.value ?? ''
  }
  function change(key: string, value: string) {
    setDirty((d) => ({ ...d, [key]: value }))
  }

  async function save() {
    if (!Object.keys(dirty).length) return
    setSaving(true)
    const ok = await updateSettings(dirty)
    setSaving(false)
    if (!ok) {
      toast.error('Save failed')
      return
    }
    // Reflect saved values locally and clear dirty + cache.
    setRows((rs) => rs.map((r) => (r.key in dirty ? { ...r, value: dirty[r.key] } : r)))
    setDirty({})
    invalidateSettingsCache()
    toast.success('Settings saved')
  }

  const dirtyCount = Object.keys(dirty).length

  return (
    <div className="p-5 lg:p-8 max-w-3xl pb-28">
      <div className="hazard h-1 w-16 rounded mb-4" />
      <h1 className="t-display text-2xl mb-1">Settings</h1>
      <p className="text-steel text-sm mb-6">
        Change these without touching code. Public values appear on the storefront.
      </p>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat] || { label: cat, icon: Cog }
          const Icon = meta.icon
          const on = active === cat
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={[
                'flex items-center gap-2 px-3.5 py-2 rounded text-sm transition-colors t-display tracking-wide',
                on ? 'bg-amber text-ink' : 'bg-panel border border-line text-steel hover:text-chrome',
              ].join(' ')}
            >
              <Icon className="w-4 h-4" />
              {meta.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-steel text-sm py-12">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading settings…
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((s) => (
            <div key={s.key} className="bg-panel border border-line rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-chrome text-sm font-medium">{s.label || s.key}</div>
                  <div className="text-steel text-[11px] t-data">{s.key}</div>
                </div>
                <span
                  className="flex items-center gap-1 text-[10px] t-display tracking-widest"
                  title={s.is_public ? 'Visible on storefront' : 'Internal only'}
                >
                  {s.is_public ? (
                    <><Globe className="w-3 h-3 text-amber" /> <span className="text-amber">PUBLIC</span></>
                  ) : (
                    <><Lock className="w-3 h-3 text-steel" /> <span className="text-steel">INTERNAL</span></>
                  )}
                </span>
              </div>

              {s.type === 'boolean' ? (
                <button
                  onClick={() => change(s.key, valueOf(s) === 'true' ? 'false' : 'true')}
                  className={[
                    'relative w-12 h-6 rounded-full transition-colors',
                    valueOf(s) === 'true' ? 'bg-amber' : 'bg-line',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute top-0.5 w-5 h-5 rounded-full bg-ink transition-all',
                      valueOf(s) === 'true' ? 'left-6' : 'left-0.5',
                    ].join(' ')}
                  />
                </button>
              ) : (
                <input
                  type={s.type === 'number' ? 'number' : 'text'}
                  value={valueOf(s)}
                  onChange={(e) => change(s.key, e.target.value)}
                  className="w-full rounded px-3 py-2 text-sm t-data"
                />
              )}
            </div>
          ))}
          {visible.length === 0 && (
            <div className="text-center text-steel py-12 text-sm">No settings in this group.</div>
          )}
        </div>
      )}

      {/* Floating unsaved-changes bar */}
      {dirtyCount > 0 && (
        <div className="fixed bottom-5 right-5 left-5 lg:left-auto bg-panel2 border border-amber rounded-lg px-4 py-3 flex items-center justify-between gap-4 shadow-xl">
          <span className="flex items-center gap-2 text-sm text-chrome">
            <AlertCircle className="w-4 h-4 text-amber" />
            {dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-amber hover:bg-amber/90 disabled:opacity-60 text-ink t-display px-4 py-2 rounded transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      )}
    </div>
  )
}
