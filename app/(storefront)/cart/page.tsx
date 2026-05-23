'use client'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import { useSetting } from '@/components/SettingsProvider'
import { Minus, Plus, Trash2, ShoppingCart, MessageCircle, ImageOff, CreditCard } from 'lucide-react'

export default function CartPage() {
  const { items, setQty, remove, subtotal, clear } = useCart()
  const currency = useSetting('payment_currency', 'GH₵')
  const whatsapp = useSetting('business_whatsapp', '')
  const businessName = useSetting('business_name', 'Auto Supply')

  function orderOnWhatsApp() {
    const lines = items.map((i) => `• ${i.qty} × ${i.name} (${i.sku}) — ${currency}${(i.price * i.qty).toFixed(2)}`)
    const msg =
      `Hello ${businessName}, I'd like to order:\n\n` +
      lines.join('\n') +
      `\n\nSubtotal: ${currency}${subtotal.toFixed(2)}\n\nMy name:\nDelivery address:\nRegion:`
    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 lg:px-6 py-20 text-center">
        <ShoppingCart className="w-10 h-10 text-line mx-auto mb-4" />
        <h1 className="t-display text-2xl mb-2">Your cart is empty</h1>
        <p className="text-steel text-sm mb-6">Add some parts and they&apos;ll show up here.</p>
        <Link href="/products" className="inline-flex bg-amber text-ink t-display px-6 py-3 rounded hover:bg-amber/90">Browse parts</Link>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-6 py-8">
      <div className="hazard h-1 w-16 rounded mb-4" />
      <h1 className="t-display text-3xl mb-6">Your cart</h1>

      <div className="space-y-2 mb-6">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 bg-panel border border-line rounded-lg p-3">
            <div className="w-14 h-14 rounded bg-ink border border-line overflow-hidden flex items-center justify-center shrink-0">
              {i.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.image} alt="" className="w-full h-full object-cover" />
              ) : <ImageOff className="w-4 h-4 text-line" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-chrome text-sm truncate">{i.name}</div>
              <div className="t-data text-[11px] text-steel">{i.sku}</div>
              <div className="t-data text-amber text-sm mt-0.5">{currency}{i.price.toFixed(2)}</div>
            </div>
            <div className="flex items-center border border-line rounded shrink-0">
              <button onClick={() => setQty(i.id, i.qty - 1)} className="px-2 py-1.5 text-steel hover:text-chrome"><Minus className="w-3.5 h-3.5" /></button>
              <span className="w-8 text-center t-data text-sm text-chrome">{i.qty}</span>
              <button onClick={() => setQty(i.id, i.qty + 1)} className="px-2 py-1.5 text-steel hover:text-chrome"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            <button onClick={() => remove(i.id)} className="text-steel hover:text-bad p-1.5 shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      <div className="bg-panel border border-line rounded-lg p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-steel text-sm">Subtotal</span>
          <span className="t-data text-xl text-chrome">{currency}{subtotal.toFixed(2)}</span>
        </div>
        <p className="text-steel text-xs mb-5">Delivery is calculated by region when you confirm your order.</p>

        <Link
          href="/checkout"
          className="w-full flex items-center justify-center gap-2 bg-amber hover:bg-amber/90 text-ink t-display py-3 rounded transition-colors"
        >
          <CreditCard className="w-5 h-5" /> Checkout
        </Link>

        <div className="flex items-center gap-3 my-3">
          <div className="h-px bg-line flex-1" />
          <span className="text-steel text-[11px] t-display">OR</span>
          <div className="h-px bg-line flex-1" />
        </div>

        <button
          onClick={orderOnWhatsApp}
          disabled={!whatsapp}
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:brightness-95 disabled:opacity-50 text-black t-display py-3 rounded transition-all"
        >
          <MessageCircle className="w-5 h-5" /> Order on WhatsApp
        </button>

        <button onClick={clear} className="w-full text-steel hover:text-bad text-xs mt-4">Clear cart</button>
      </div>
    </main>
  )
}
