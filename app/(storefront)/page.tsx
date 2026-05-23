'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listFeatured } from '@/lib/public-queries'
import { listCategories } from '@/lib/queries'
import type { Product, Category } from '@/lib/types'
import ProductCard from '@/components/storefront/ProductCard'
import { ShieldCheck, Truck, Smartphone, ArrowRight, Loader2 } from 'lucide-react'

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listFeatured(8), listCategories()])
      .then(([f, c]) => { setFeatured(f); setCategories(c) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 opacity-[0.04] hazard" />
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-16 lg:py-24 relative">
          <div className="max-w-2xl">
            <div className="t-display text-amber text-xs tracking-[0.3em] mb-4">GENUINE AUTO PARTS · GHANA</div>
            <h1 className="t-display text-4xl lg:text-6xl leading-[0.95] mb-5">
              The right part,<br />delivered fast.
            </h1>
            <p className="text-steel text-base lg:text-lg mb-8 max-w-lg">
              Filters, lubricants, plugs, brakes and more — genuine stock, fair prices,
              and delivery across all 16 regions. Order online or on WhatsApp.
            </p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-amber text-ink t-display px-6 py-3 rounded hover:bg-amber/90 transition-colors">
              Browse parts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-line bg-panel/40">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, t: 'Genuine parts', s: 'Sourced and verified' },
            { icon: Truck, t: 'Nationwide delivery', s: 'All 16 regions' },
            { icon: Smartphone, t: 'MoMo & WhatsApp', s: 'Pay the way you want' },
          ].map(({ icon: Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-amber shrink-0" />
              <div>
                <div className="text-chrome text-sm t-display tracking-wide">{t}</div>
                <div className="text-steel text-xs">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-12">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((c) => (
              <Link key={c.id} href={`/products?category=${c.slug}`}
                className="px-4 py-2 rounded-full border border-line text-sm text-steel hover:border-amber hover:text-chrome transition-colors t-display tracking-wide">
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {/* Featured */}
        <div className="flex items-end justify-between mb-5">
          <h2 className="t-display text-2xl">Latest stock</h2>
          <Link href="/products" className="text-steel hover:text-amber text-sm flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-steel text-sm py-16 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : featured.length === 0 ? (
          <div className="text-center py-16 text-steel text-sm">No products yet — check back soon.</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </main>
  )
}
