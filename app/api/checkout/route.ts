import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type InItem = { id: string; qty: number }
type InCustomer = { name: string; phone: string; email?: string; region: string; address: string }

function deliveryFeeFor(region: string, settings: Record<string, string>): number {
  const key = `delivery_fee_${region.toLowerCase().replace(/\s+/g, '_')}`
  return parseFloat(settings[key] ?? settings['delivery_fee_default'] ?? '0') || 0
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const items: InItem[] = body?.items ?? []
    const customer: InCustomer = body?.customer ?? {}
    const method: 'paystack' | 'cod' = body?.method === 'cod' ? 'cod' : 'paystack'

    if (!items.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    if (!customer.name || !customer.phone || !customer.region || !customer.address)
      return NextResponse.json({ error: 'Please fill in all delivery details' }, { status: 400 })
    if (method === 'paystack' && !customer.email)
      return NextResponse.json({ error: 'Email is required for online payment' }, { status: 400 })

    const admin = createAdminClient()

    // --- Recompute everything from the DB. Never trust client prices. ---
    const ids = items.map((i) => i.id)
    const { data: products, error: pErr } = await admin
      .from('products').select('id,name,price,is_active,is_deleted').in('id', ids)
    if (pErr) throw pErr

    const live = new Map((products ?? []).map((p: any) => [p.id, p]))
    const lines = items
      .map((i) => {
        const p = live.get(i.id)
        if (!p || p.is_deleted || !p.is_active) return null
        return {
          product_id: p.id,
          product_name: p.name as string,
          unit_price: Number(p.price),
          quantity: Math.max(1, Math.floor(i.qty)),
        }
      })
      .filter(Boolean) as { product_id: string; product_name: string; unit_price: number; quantity: number }[]

    if (!lines.length) return NextResponse.json({ error: 'No valid items in cart' }, { status: 400 })

    const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0)

    const { data: settingRows } = await admin.from('settings').select('key,value')
    const settings: Record<string, string> = {}
    ;(settingRows ?? []).forEach((r: any) => { settings[r.key] = r.value ?? '' })
    const delivery = deliveryFeeFor(customer.region, settings)
    const total = subtotal + delivery

    const { data: branchId } = await admin.rpc('resolve_fulfilling_branch', { p_region: customer.region })

    // --- Customer (reuse by phone) ---
    let customerId: string
    const { data: existing } = await admin.from('customers').select('id').eq('phone', customer.phone).limit(1).maybeSingle()
    if (existing) {
      customerId = existing.id
      await admin.from('customers').update({
        name: customer.name, email: customer.email ?? null, region: customer.region, address: customer.address,
      }).eq('id', customerId)
    } else {
      const { data: c, error: cErr } = await admin.from('customers').insert({
        name: customer.name, phone: customer.phone, email: customer.email ?? null,
        region: customer.region, address: customer.address,
      }).select('id').single()
      if (cErr) throw cErr
      customerId = c.id
    }

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`

    const { data: order, error: oErr } = await admin.from('orders').insert({
      order_number: orderNumber,
      customer_id: customerId,
      fulfilling_branch_id: branchId ?? null,
      customer_region: customer.region,
      delivery_address: customer.address,
      status: method === 'cod' ? 'processing' : 'pending',
      payment_method: method === 'cod' ? 'cash_on_delivery' : 'card',
      payment_status: 'unpaid',
      subtotal, delivery_fee: delivery, total,
    }).select('id, order_number').single()
    if (oErr) throw oErr

    const { error: iErr } = await admin.from('order_items').insert(lines.map((l) => ({ order_id: order.id, ...l })))
    if (iErr) throw iErr

    if (method === 'cod') {
      // Cash on delivery is a committed sale — decrement stock now.
      await admin.rpc('decrement_order_stock', { p_order_id: order.id })
      return NextResponse.json({ ok: true, cod: true, reference: order.order_number })
    }

    // --- Paystack: initialize, return the hosted checkout URL ---
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: 'Payment is not configured (missing PAYSTACK_SECRET_KEY)' }, { status: 500 })
    }
    const origin = new URL(req.url).origin
    const psRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customer.email,
        amount: Math.round(total * 100), // pesewas
        currency: 'GHS',
        reference: order.order_number,
        callback_url: `${origin}/checkout/success`,
        metadata: { order_id: order.id, order_number: order.order_number },
      }),
    })
    const psJson = await psRes.json()
    if (!psJson.status) {
      return NextResponse.json({ error: psJson.message || 'Could not start payment' }, { status: 502 })
    }
    return NextResponse.json({ ok: true, authorization_url: psJson.data.authorization_url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Checkout failed' }, { status: 500 })
  }
}
