'use client'
import { useEffect, useState } from 'react'
import { listAllBranches, saveBranch, setMainBranch, type BranchInput } from '@/lib/queries'
import type { Branch } from '@/lib/types'
import { GHANA_REGIONS } from '@/lib/regions'
import Modal, { Field } from '@/components/admin/Modal'
import { Building2, Plus, Pencil, Star, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const input = 'w-full rounded px-3 py-2 text-sm'

export default function BranchesPage() {
  const [rows, setRows] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    try { setRows(await listAllBranches()) }
    catch { toast.error('Could not load branches') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function makeMain(b: Branch) {
    if (b.is_main) return
    if (!confirm(`Make "${b.name}" the main branch? New orders without a regional branch route here.`)) return
    try { await setMainBranch(b.id); toast.success('Main branch updated'); load() } catch { toast.error('Failed') }
  }

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="hazard h-1 w-16 rounded mb-4" />
      <div className="flex items-center justify-between mb-1">
        <h1 className="t-display text-2xl">Branches</h1>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="flex items-center gap-1.5 bg-amber text-ink t-display px-4 py-2 rounded">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <p className="text-steel text-sm mb-6">Orders route to the branch in the customer&apos;s region, falling back to main.</p>

      {loading ? (
        <div className="flex items-center gap-2 text-steel text-sm py-16 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="space-y-2">
          {rows.map((b) => (
            <div key={b.id} className="flex items-center gap-3 bg-panel border border-line rounded-lg p-3">
              <Building2 className="w-4 h-4 text-steel shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-chrome text-sm">{b.name}</span>
                  {b.is_main && <span className="flex items-center gap-1 text-[10px] t-display text-amber"><Star className="w-3 h-3 fill-amber" /> MAIN</span>}
                  {!b.is_active && <span className="text-[10px] t-display text-steel border border-line rounded px-1">INACTIVE</span>}
                </div>
                <div className="text-[11px] text-steel">{b.region}{b.town ? ` · ${b.town}` : ''}</div>
              </div>
              {!b.is_main && (
                <button onClick={() => makeMain(b)} className="text-steel hover:text-amber p-1.5" title="Set as main"><Star className="w-4 h-4" /></button>
              )}
              <button onClick={() => { setEditing(b); setShowForm(true) }} className="text-steel hover:text-chrome p-1.5"><Pencil className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {showForm && <BranchForm branch={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}

function BranchForm({ branch, onClose, onSaved }: { branch: Branch | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(branch?.name ?? '')
  const [region, setRegion] = useState(branch?.region ?? '')
  const [town, setTown] = useState(branch?.town ?? '')
  const [phone, setPhone] = useState(branch?.phone ?? '')
  const [whatsapp, setWhatsapp] = useState(branch?.whatsapp ?? '')
  const [active, setActive] = useState(branch?.is_active ?? true)
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!name.trim() || !region) { toast.error('Name and region are required'); return }
    const payload: BranchInput = { id: branch?.id, name, region, town: town.trim() || null, phone: phone.trim() || null, whatsapp: whatsapp.trim() || null, is_active: active }
    setSaving(true)
    try { await saveBranch(payload); toast.success(branch ? 'Branch updated' : 'Branch added'); onSaved() }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  return (
    <Modal title={branch ? 'Edit Branch' : 'New Branch'} onClose={onClose}
      footer={
        <button onClick={submit} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-amber text-ink t-display py-2.5 rounded disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {branch ? 'Save' : 'Add branch'}
        </button>
      }>
      <Field label="Branch name"><input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tarkwa Branch" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Region">
          <select className={input} value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">Select</option>
            {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Town"><input className={input} value={town} onChange={(e) => setTown(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone"><input className={`${input} t-data`} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Field label="WhatsApp"><input className={`${input} t-data`} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="233…" /></Field>
      </div>
      <button onClick={() => setActive((v) => !v)} className="flex items-center gap-2 text-sm mt-1">
        <span className={`w-4 h-4 rounded-sm border ${active ? 'bg-ok border-ok' : 'border-line'}`} />
        <span className="text-chrome">Active</span>
      </button>
    </Modal>
  )
}
