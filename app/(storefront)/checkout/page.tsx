'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/CartProvider'
import { useSetting, useSettings } from '@/components/SettingsProvider'
import { GHANA_REGIONS, deliveryFeeFor } from '@/lib/regions'
import { Loader2, CreditCard, Banknote, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

const input = 'w-full rounded px-3 py-2.5 text-sm'

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart()
  const router = useRouter()
  const settings = useSettings()
  const currency = useSetting('payment_currency', 'GH₵')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [region, setRegion] = useState('')
  const [address, setAddress] = useState('')
  const [method, setMethod] = useState<'paystack' | 'cod'>('paystack')
  const [busy, setBusy] = useState(false)

  const delivery = useMemo(() => deliveryFeeFor(region, settings), [region, settings])
  const total = subtotal + delivery

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 lg:px-6 py-20 text-center">
        <ShoppingCart className="w-10 h-10 text-line mx-auto mb-4" />
        <h1 className="t-display text-2xl mb-2">Nothing to check out</h1>
        <Link href="/products" className="inline-flex bg-amber text-ink t-display px-6 py-3 rounded mt-2">Browse parts</Link>
      </main>
    )
  }

  async function placeOrder() {
    if (!name || !phone || !region || !address) { toast.error('Fill in all delivery details'); return }
    if (method === 'paystack' && !email) { toast.error('Email is required for online payment'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          customer: { name, phone, email, region, address },
          method,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Checkout failed'); setBusy(false); return }

      if (data.cod) {
        clear()
        router.push(`/checkout/success?ref=${encodeURIComponent(data.reference)}&cod=1`)
        return
      }
      if (data.authorization_url) {
        window.location.href = data.authorization_url  // hand off to Paystack
        return
      }
      toast.error('Unexpected response')
      setBusy(false)
    } catch {
      toast.error('Network error')
      setBusy(false)
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 lg:px-6 py-8">
      <div className="hazard h-1 w-16 rounded mb-4" />
      <h1 className="t-display text-3xl mb-6">Checkout</h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* details */}
        <div>
          <h2 className="t-display text-sm tracking-widest text-steel mb-3">DELIVERY DETAILS</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input className={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={input} placeholder="Phone (e.g. 024…)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <input className={`${input} mb-3`} placeholder="Email (for payment receipt)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select className={`${input} mb-3`} value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">Select region</option>
            {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <textarea className={`${input} min-h-[80px] mb-6`} placeholder="Delivery address — landmark, area, town" value={address} onChange={(e) => setAddress(e.target.value)} />

          <h2 className="t-display text-sm tracking-widest text-steel mb-3">PAYMENT</h2>
          <div className="space-y-2">
            <button onClick={() => setMethod('paystack')} className={`w-full flex items-center gap-3 p-3 rounded border text-left ${method === 'paystack' ? 'border-amber bg-panel2' : 'border-line bg-panel'}`}>
              <CreditCard className="w-5 h-5 text-amber" />
              <div>
                <div className="text-sm text-chrome t-display tracking-wide">Pay online</div>
                <div className="text-xs text-steel">Card or Mobile Money via Paystack</div>
              </div>
            </button>
            <button onClick={() => setMethod('cod')} className={`w-full flex items-center gap-3 p-3 rounded border text-left ${method === 'cod' ? 'border-amber bg-panel2' : 'border-line bg-panel'}`}>
              <Banknote className="w-5 h-5 text-amber" />
              <div>
                <div className="text-sm text-chrome t-display tracking-wide">Cash on delivery</div>
                <div className="text-xs text-steel">Pay when your parts arrive</div>
              </div>
            </button>
          </div>
        </div>

        {/* summary */}
        <div className="lg:sticky lg:top-24 self-start bg-panel border border-line rounded-lg p-5 h-fit">
          <h2 className="t-display text-sm tracking-widest text-steel mb-3">ORDER</h2>
          <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between text-sm gap-2">
                <span className="text-chrome truncate">{i.qty}× {i.name}</span>
                <span className="t-data text-steel shrink-0">{currency}{(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-line pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-steel">Subtotal</span><span className="t-data text-chrome">{currency}{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-steel">Delivery {region ? '' : '(select region)'}</span><span className="t-data text-chrome">{currency}{delivery.toFixed(2)}</span></div>
            <div className="flex justify-between pt-1.5 border-t border-line"><span className="t-display">Total</span><span className="t-data text-lg text-amber">{currency}{total.toFixed(2)}</span></div>
          </div>
          <button onClick={placeOrder} disabled={busy} className="w-full mt-5 flex items-center justify-center gap-2 bg-amber hover:bg-amber/90 disabled:opacity-60 text-ink t-display py-3 rounded">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {method === 'cod' ? 'Place order' : `Pay ${currency}${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </main>
  )
}
