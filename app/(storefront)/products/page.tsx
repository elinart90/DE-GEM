'use client'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { listPublicProducts, listAllPublicProducts } from '@/lib/public-queries'
import { listCategories, listBrands } from '@/lib/queries'
import type { Product, Category, Brand } from '@/lib/types'
import ProductCard from '@/components/storefront/ProductCard'
import { Search, ChevronLeft, ChevronRight, ArrowRight, Loader2, SlidersHorizontal } from 'lucide-react'

const PAGE_SIZE = 12
const PER_SECTION = 8

function ProductsInner() {
  const params = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [categorySlug, setCategorySlug] = useState(params.get('category') ?? '')
  const [brandSlug, setBrandSlug] = useState(params.get('brand') ?? '')
  const [page, setPage] = useState(1)

  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  // filtered mode
  const [rows, setRows] = useState<Product[]>([])
  const [count, setCount] = useState(0)
  // browse mode
  const [all, setAll] = useState<Product[]>([])

  const filtering = !!(search.trim() || categorySlug || brandSlug)

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {})
    listBrands().then(setBrands).catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (filtering) {
        const res = await listPublicProducts({ search, categorySlug, brandSlug, page, pageSize: PAGE_SIZE })
        setRows(res.rows); setCount(res.count)
      } else {
        setAll(await listAllPublicProducts())
      }
    } catch { /* keep storefront calm */ }
    finally { setLoading(false) }
  }, [filtering, search, categorySlug, brandSlug, page])

  useEffect(() => {
    const t = setTimeout(fetchData, 250)
    return () => clearTimeout(t)
  }, [fetchData])
  useEffect(() => { setPage(1) }, [search, categorySlug, brandSlug])

  // group browse-mode products under their categories
  const sections = useMemo(() => {
    const named = categories
      .map((c) => ({ cat: c, items: all.filter((p) => p.category_id === c.id) }))
      .filter((s) => s.items.length > 0)
    const known = new Set(categories.map((c) => c.id))
    const orphans = all.filter((p) => !p.category_id || !known.has(p.category_id))
    return { named, orphans }
  }, [all, categories])

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <main className="max-w-6xl mx-auto px-4 lg:px-6 py-8">
      <div className="hazard h-1 w-16 rounded mb-4" />
      <h1 className="t-display text-3xl mb-6">Shop parts</h1>

      <div className="flex flex-col lg:flex-row gap-2 mb-8">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search parts, brands, your car…" className="w-full rounded-full pl-9 pr-3 py-2.5 text-sm bg-panel" />
        </div>
        <div className="flex gap-2">
          <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="flex-1 lg:flex-none rounded px-3 py-2.5 text-sm">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <select value={brandSlug} onChange={(e) => setBrandSlug(e.target.value)} className="flex-1 lg:flex-none rounded px-3 py-2.5 text-sm">
            <option value="">All brands</option>
            {brands.map((b) => <option key={b.id} value={b.slug}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-steel text-sm py-20 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : filtering ? (
        // -------- filtered / search mode: flat grid + pagination --------
        rows.length === 0 ? (
          <div className="text-center py-20 text-steel">
            <SlidersHorizontal className="w-7 h-7 mx-auto mb-3 text-line" />
            <p className="text-sm">No parts match that.</p>
            <button onClick={() => { setSearch(''); setCategorySlug(''); setBrandSlug('') }} className="text-amber text-xs mt-2 hover:underline">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="text-steel text-xs t-data mb-3">{count} part{count !== 1 ? 's' : ''}</div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {rows.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded border border-line text-steel disabled:opacity-40 hover:text-chrome"><ChevronLeft className="w-4 h-4" /></button>
                <span className="t-data text-xs text-steel">{page} / {pages}</span>
                <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded border border-line text-steel disabled:opacity-40 hover:text-chrome"><ChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </>
        )
      ) : (
        // -------- browse mode: grouped by category --------
        sections.named.length === 0 && sections.orphans.length === 0 ? (
          <div className="text-center py-20 text-steel text-sm">No products yet — check back soon.</div>
        ) : (
          <div className="space-y-12">
            {sections.named.map(({ cat, items }) => (
              <section key={cat.id}>
                <div className="flex items-end justify-between mb-4 border-b border-line pb-2">
                  <h2 className="t-display text-xl">{cat.name}</h2>
                  {items.length > PER_SECTION && (
                    <button onClick={() => setCategorySlug(cat.slug)} className="text-steel hover:text-amber text-sm flex items-center gap-1">
                      View all {items.length} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {items.slice(0, PER_SECTION).map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
            ))}

            {sections.orphans.length > 0 && (
              <section>
                <div className="flex items-end justify-between mb-4 border-b border-line pb-2">
                  <h2 className="t-display text-xl">Other</h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {sections.orphans.slice(0, PER_SECTION).map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
            )}
          </div>
        )
      )}
    </main>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex items-center gap-2 text-steel text-sm py-20 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}>
      <ProductsInner />
    </Suspense>
  )
}
