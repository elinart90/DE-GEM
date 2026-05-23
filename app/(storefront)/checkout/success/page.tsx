'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/components/CartProvider'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

function SuccessInner() {
  const params = useSearchParams()
  const { clear } = useCart()
  const reference = params.get('reference') || params.get('ref') || ''
  const isCod = params.get('cod') === '1'
  const [state, setState] = useState<'checking' | 'ok' | 'failed'>(isCod ? 'ok' : 'checking')

  useEffect(() => {
    if (isCod) { clear(); return }
    if (!reference) { setState('failed'); return }
    fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) { setState('ok'); clear() } else setState('failed')
      })
      .catch(() => setState('failed'))
  }, [reference, isCod])

  return (
    <main className="max-w-lg mx-auto px-4 lg:px-6 py-20 text-center">
      {state === 'checking' && (
        <>
          <Loader2 className="w-10 h-10 text-amber mx-auto mb-4 animate-spin" />
          <h1 className="t-display text-2xl mb-2">Confirming payment…</h1>
          <p className="text-steel text-sm">One moment.</p>
        </>
      )}
      {state === 'ok' && (
        <>
          <CheckCircle2 className="w-12 h-12 text-ok mx-auto mb-4" />
          <h1 className="t-display text-3xl mb-2">Order confirmed</h1>
          <p className="text-steel text-sm mb-1">
            {isCod ? 'Your order is placed — pay on delivery.' : 'Payment received. Thank you!'}
          </p>
          {reference && <p className="t-data text-xs text-steel mb-6">Ref: {reference}</p>}
          <p className="text-steel text-sm mb-6">We&apos;ll be in touch to arrange delivery.</p>
          <Link href="/products" className="inline-flex bg-amber text-ink t-display px-6 py-3 rounded">Keep shopping</Link>
        </>
      )}
      {state === 'failed' && (
        <>
          <XCircle className="w-12 h-12 text-bad mx-auto mb-4" />
          <h1 className="t-display text-2xl mb-2">Payment not confirmed</h1>
          <p className="text-steel text-sm mb-6">
            If you were charged, contact us with your reference and we&apos;ll sort it out.
          </p>
          <Link href="/cart" className="inline-flex border border-line text-chrome t-display px-6 py-3 rounded">Back to cart</Link>
        </>
      )}
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-steel text-sm"><Loader2 className="w-4 h-4 animate-spin inline" /></div>}>
      <SuccessInner />
    </Suspense>
  )
}
