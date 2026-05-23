'use client'
import { useEffect, useState } from 'react'
import { listCategories, listBrands, saveTaxonomy, archiveTaxonomy } from '@/lib/queries'
import type { Category, Brand } from '@/lib/types'
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

type Row = Category | Brand

export default function TaxonomyManager({ table }: { table: 'categories' | 'brands' }) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  async function load() {
    setLoading(true)
    try {
      setRows(table === 'categories' ? await listCategories() : await listBrands())
    } catch {
      toast.error('Could not load')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [table])

  async function add() {
    if (!adding.trim()) return
    try {
      await saveTaxonomy(table, adding)
      setAdding('')
      load()
    } catch (e: any) {
      toast.error(e?.code === '23505' ? 'Already exists' : 'Add failed')
    }
  }
  async function rename(id: string) {
    if (!editName.trim()) return
    try {
      await saveTaxonomy(table, editName, id)
      setEditId(null)
      load()
    } catch { toast.error('Rename failed') }
  }
  async function remove(id: string) {
    if (!confirm('Archive this? Products keep their history.')) return
    try { await archiveTaxonomy(table, id); load() } catch { toast.error('Archive failed') }
  }

  return (
    <div className="max-w-md">
      <div className="flex gap-2 mb-4">
        <input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={table === 'categories' ? 'New category' : 'New brand'}
          className="flex-1 rounded px-3 py-2 text-sm"
        />
        <button onClick={add} className="flex items-center gap-1.5 bg-amber text-ink t-display px-3 rounded">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-steel text-sm py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="divide-y divide-line border border-line rounded-lg overflow-hidden">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2 px-3 py-2.5 bg-panel">
              {editId === r.id ? (
                <>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 rounded px-2 py-1 text-sm" autoFocus />
                  <button onClick={() => rename(r.id)} className="text-ok p-1"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditId(null)} className="text-steel p-1"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-chrome">{r.name}</span>
                  <button onClick={() => { setEditId(r.id); setEditName(r.name) }} className="text-steel hover:text-chrome p-1"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(r.id)} className="text-steel hover:text-bad p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>
          ))}
          {rows.length === 0 && <div className="px-3 py-6 text-center text-steel text-sm bg-panel">None yet.</div>}
        </div>
      )}
    </div>
  )
}
