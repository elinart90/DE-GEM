'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  listOrders, getOrder, setOrderStatus, setPaymentStatus, ORDER_STATUSES,
} from '@/lib/queries'
import type { Order } from '@/lib/types'
import { useSetting } from '@/components/SettingsProvider'
import Modal from '@/components/admin/Modal'
import {
  Search, Loader2, ChevronLeft, ChevronRight, Phone, MapPin, Package, CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'

const PAGE_SIZE = 15
const FILTERS = ['all', ...ORDER_STATUSES] as const

const STATUS_STYLE: Record<string, string> = {
  pending: 'text-warn border-warn/40',
  paid: 'text-ok border-ok/40',
  processing: 'text-amber border-amber/40',
  shipped: 'text-chrome border-line',
  delivered: 'text-ok border-ok/40',
  cancelled: 'text-bad border-bad/40',
}

export default function OrdersPage() {
  const currency = useSetting('payment_currency', 'GH₵')
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<Order[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Order | null>(null)
  const [busy, setBusy] = useState(false)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listOrders({ status, search, page, pageSize: PAGE_SIZE })
      setRows(res.rows); setCount(res.count)
    } catch { toast.error('Could not load orders') }
    finally { setLoading(false) }
  }, [status, search, page])

  useEffect(() => { const t = setTimeout(fetchRows, 250); return () => clearTimeout(t) }, [fetchRows])
  useEffect(() => { setPage(1) }, [status, search])

  async function openOrder(o: Order) {
    try { setOpen(await getOrder(o.id)) } catch { toast.error('Could not open order') }
  }

  async function changeStatus(newStatus: string) {
    if (!open) return
    setBusy(true)
    try {
      await setOrderStatus(open.id, newStatus)
      setOpen({ ...open, status: newStatus })
      toast.success(`Marked ${newStatus}`)
      fetchRows()
    } catch { toast.error('Update failed') }
    finally { setBusy(false) }
  }

  async function markPaid() {
    if (!open) return
    setBusy(true)
    try {
      await setPaymentStatus(open.id, 'paid')
      setOpen({ ...open, payment_status: 'paid' })
      toast.success('Marked paid')
      fetchRows()
    } catch { toast.error('Update failed') }
    finally { setBusy(false) }
  }

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div className="p-5 lg:p-8 max-w-4xl">
      <div className="hazard h-1 w-16 rounded mb-4" />
      <h1 className="t-display text-2xl mb-1">Orders</h1>
      <p className="text-steel text-sm mb-5">Fulfil and track every order from here.</p>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setStatus(f)}
            className={`px-3 py-1.5 rounded text-xs t-display tracking-wide capitalize transition-colors ${
              status === f ? 'bg-amber text-ink' : 'bg-panel border border-line text-steel hover:text-chrome'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order # or region…" className="w-full rounded pl-9 pr-3 py-2 text-sm" />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-steel text-sm py-16 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-steel text-sm">No orders here yet.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((o) => (
            <button key={o.id} onClick={() => openOrder(o)} className="w-full flex items-center gap-3 bg-panel border border-line rounded-lg p-3 text-left hover:border-steel transition-colors">
              <Package className="w-4 h-4 text-steel shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="t-data text-sm text-chrome">{o.order_number}</span>
                  <span className={`text-[10px] t-display tracking-wide border rounded px-1.5 py-0.5 capitalize ${STATUS_STYLE[o.status] ?? 'text-steel border-line'}`}>{o.status}</span>
                </div>
                <div className="text-[11px] text-steel truncate">
                  {o.customers?.name ?? 'Guest'} · {o.customer_region ?? '—'} · {new Date(o.created_at).toLocaleString()}
                </div>
              </div>
              <div className="t-data text-amber text-sm shrink-0">{currency}{Number(o.total).toFixed(2)}</div>
            </button>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded border border-line text-steel disabled:opacity-40 hover:text-chrome"><ChevronLeft className="w-4 h-4" /></button>
          <span className="t-data text-xs text-steel">{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded border border-line text-steel disabled:opacity-40 hover:text-chrome"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      {open && (
        <Modal title={open.order_number} onClose={() => setOpen(null)}>
          {/* customer */}
          <div className="bg-ink border border-line rounded p-3 mb-4">
            <div className="text-chrome text-sm font-medium mb-1">{open.customers?.name ?? 'Guest'}</div>
            {open.customers?.phone && (
              <a href={`tel:${open.customers.phone}`} className="flex items-center gap-2 text-steel text-sm hover:text-amber"><Phone className="w-3.5 h-3.5" /> {open.customers.phone}</a>
            )}
            <div className="flex items-start gap-2 text-steel text-sm mt-1"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span>{open.delivery_address ?? '—'}{open.customer_region ? `, ${open.customer_region}` : ''}</span></div>
          </div>

          {/* items */}
          <div className="space-y-1.5 mb-3">
            {open.order_items?.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span className="text-chrome">{it.quantity}× {it.product_name}</span>
                <span className="t-data text-steel">{currency}{(it.unit_price * it.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-line pt-2 space-y-1 text-sm mb-5">
            <div className="flex justify-between"><span className="text-steel">Subtotal</span><span className="t-data text-chrome">{currency}{Number(open.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-steel">Delivery</span><span className="t-data text-chrome">{currency}{Number(open.delivery_fee).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="t-display">Total</span><span className="t-data text-amber">{currency}{Number(open.total).toFixed(2)}</span></div>
            <div className="flex justify-between pt-1"><span className="text-steel text-xs">Payment</span><span className="text-xs t-display capitalize">{open.payment_method ?? '—'} · {open.payment_status}</span></div>
          </div>

          {/* payment action (mainly for COD) */}
          {open.payment_status !== 'paid' && (
            <button onClick={markPaid} disabled={busy} className="w-full flex items-center justify-center gap-2 border border-ok text-ok hover:bg-ok hover:text-ink t-display py-2 rounded mb-4 transition-colors">
              <CheckCircle2 className="w-4 h-4" /> Mark payment received
            </button>
          )}

          {/* status progression */}
          <div className="text-steel text-xs t-display tracking-widest mb-2">UPDATE STATUS</div>
          <div className="grid grid-cols-3 gap-2">
            {ORDER_STATUSES.map((s) => (
              <button key={s} onClick={() => changeStatus(s)} disabled={busy || open.status === s}
                className={`py-2 rounded text-xs t-display capitalize border transition-colors ${
                  open.status === s ? 'bg-amber text-ink border-amber' : 'border-line text-steel hover:text-chrome'}`}>
                {s}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
