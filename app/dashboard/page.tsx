import { createClient } from '@/lib/supabase/server'
import { Package, AlertTriangle, ClipboardList, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getCounts() {
  const supabase = createClient()
  const [products, branches, pending] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('branches').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  return {
    products: products.count ?? 0,
    branches: branches.count ?? 0,
    pending: pending.count ?? 0,
  }
}

export default async function Overview() {
  const c = await getCounts()
  const cards = [
    { label: 'Products',       value: c.products, icon: Package,       accent: 'text-amber' },
    { label: 'Pending Orders', value: c.pending,  icon: ClipboardList, accent: 'text-warn' },
    { label: 'Active Branches',value: c.branches, icon: Building2,     accent: 'text-chrome' },
    { label: 'Low Stock',      value: '—',        icon: AlertTriangle, accent: 'text-steel' },
  ]

  return (
    <div className="p-5 lg:p-8 max-w-5xl">
      <div className="hazard h-1 w-16 rounded mb-4" />
      <h1 className="t-display text-2xl mb-1">Overview</h1>
      <p className="text-steel text-sm mb-7">Operational snapshot — main branch.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="bg-panel border border-line rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-steel text-[11px] t-display tracking-widest">{label}</span>
              <Icon className={`w-4 h-4 ${accent}`} />
            </div>
            <div className={`t-data text-3xl ${accent}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-7 bg-panel border border-line rounded-lg p-5">
        <h2 className="t-display text-sm text-amber tracking-widest mb-2">Build status — Phase 1</h2>
        <p className="text-steel text-sm leading-relaxed">
          Admin shell, authentication, and the settings module are live. Next up: product
          and category CRUD so you can load real parts, then the storefront and checkout.
          Don&apos;t build past order fulfilment until one real order has gone through.
        </p>
      </div>
    </div>
  )
}
