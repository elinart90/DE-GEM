import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Verify a Paystack transaction by reference (= our order_number), then complete
// the order ONCE. The conditional update means a refreshed/duplicate verify
// can't decrement stock twice.
export async function GET(req: Request) {
  const reference = new URL(req.url).searchParams.get('reference')
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 500 })
  }
  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })
    const json = await res.json()
    const ok = json?.data?.status === 'success'
    if (!ok) return NextResponse.json({ ok: false, status: json?.data?.status ?? 'failed' })

    const admin = createAdminClient()
    const { data: flipped } = await admin
      .from('orders')
      .update({ status: 'paid', payment_status: 'paid' })
      .eq('order_number', reference)
      .eq('payment_status', 'unpaid')
      .select('id')
    if (flipped && flipped.length) {
      await admin.rpc('decrement_order_stock', { p_order_id: flipped[0].id })
    }
    return NextResponse.json({ ok: true, reference })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Verification failed' }, { status: 500 })
  }
}
