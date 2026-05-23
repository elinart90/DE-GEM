'use client'
import { useCallback, useEffect, useState } from 'react'
import { listInventory, listBranches, adjustStock } from '@/lib/queries'
import type { Branch, InventoryRow } from '@/lib/types'
import { Search, Loader2, Boxes, AlertTriangle, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InventoryPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchId, setBranchId] = useState('')
  const [rows, setRows] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    listBranches().then((b) => {
      setBranches(b)
      const main = b.find((x) => x.is_main) ?? b[0]
      if (main) setBranchId(main.id)
    }).catch(() => toast.error('Could not load branches'))
  }, [])

  const load = useCallback(async () => {
    if (!branchId) return
    setLoading(true)
    try { setRows(await listInventory(branchId, search)) }
    catch { toast.error('Could not load inventory') }
    finally { setLoading(false) }
  }, [branchId, search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  async function save(r: InventoryRow) {
    const raw = draft[r.id]
    if (raw === undefined || raw === '') return
    const newQty = parseInt(raw, 10)
    if (isNaN(newQty) || newQty < 0) { toast.error('Enter a valid quantity'); return }
    setSavingId(r.id)
    try {
      await adjustStock({ productId: r.id, branchId, newQty, changeType: 'adjustment', reason: 'Manual stock update' })
      setDraft((d) => { const n = { ...d }; delete n[r.id]; return n })
      toast.success(`${r.name} → ${newQty}`)
      load()
    } catch { toast.error('Update failed') }
    finally { setSavingId(null) }
  }

  return (
    <div className="p-5 lg:p-8 max-w-4xl">
      <div className="hazard h-1 w-16 rounded mb-4" />
      <h1 className="t-display text-2xl mb-1">Inventory</h1>
      <p className="text-steel text-sm mb-5">Stock levels per branch. Every change is logged.</p>

      <div className="flex flex-col lg:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or SKU…" className="w-full rounded pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded px-3 py-2 text-sm">
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.is_main ? ' (main)' : ''}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-steel text-sm py-16 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-steel text-sm">No products. Add some in Catalogue first.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const low = r.stock_qty <= r.low_stock_at
            const dirty = draft[r.id] !== undefined && draft[r.id] !== String(r.stock_qty)
            return (
              <div key={r.id} className="flex items-center gap-3 bg-panel border border-line rounded-lg p-3">
                <Boxes className="w-4 h-4 text-steel shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-chrome text-sm truncate">{r.name}</div>
                  <div className="t-data text-[11px] text-steel">{r.sku}</div>
                </div>
                {low && (
                  <span className="flex items-center gap-1 text-[10px] t-display text-warn shrink-0">
                    <AlertTriangle className="w-3 h-3" /> LOW
                  </span>
                )}
                <input
                  type="number"
                  value={draft[r.id] ?? String(r.stock_qty)}
                  onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                  className={`w-20 rounded px-2 py-1.5 text-sm t-data text-right ${low ? 'text-warn' : 'text-chrome'}`}
                />
                <button
                  onClick={() => save(r)}
                  disabled={!dirty || savingId === r.id}
                  className="bg-amber disabled:opacity-30 text-ink p-1.5 rounded shrink-0"
                  title="Save quantity"
                >
                  {savingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
