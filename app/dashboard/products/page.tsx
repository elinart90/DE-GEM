'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  listProducts, listCategories, listBrands, archiveProduct, type ProductFilter,
} from '@/lib/queries'
import type { Product, Category, Brand } from '@/lib/types'
import { useSetting } from '@/components/SettingsProvider'
import ProductForm from '@/components/admin/ProductForm'
import TaxonomyManager from '@/components/admin/TaxonomyManager'
import {
  Plus, Search, Pencil, Archive, ChevronLeft, ChevronRight, Loader2, ShieldCheck, ImageOff,
} from 'lucide-react'
import toast from 'react-hot-toast'

const PAGE_SIZE = 12
const TABS = ['Products', 'Categories', 'Brands'] as const

export default function ProductsPage() {
  const currency = useSetting('payment_currency', 'GH₵')
  const [tab, setTab] = useState<(typeof TABS)[number]>('Products')

  const [rows, setRows] = useState<Product[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')

  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [editing, setEditing] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const f: ProductFilter = { search, categoryId, brandId, page, pageSize: PAGE_SIZE }
      const res = await listProducts(f)
      setRows(res.rows); setCount(res.count)
    } catch { toast.error('Could not load products') }
    finally { setLoading(false) }
  }, [search, categoryId, brandId, page])

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {})
    listBrands().then(setBrands).catch(() => {})
  }, [])
  useEffect(() => { if (tab === 'Products') fetchProducts() }, [tab, fetchProducts])
  useEffect(() => { setPage(1) }, [search, categoryId, brandId])

  async function archive(p: Product) {
    if (!confirm(`Archive "${p.name}"? It stays on past invoices but leaves the catalogue.`)) return
    try { await archiveProduct(p.id); fetchProducts() } catch { toast.error('Archive failed') }
  }

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div className="p-5 lg:p-8 max-w-5xl">
      <div className="hazard h-1 w-16 rounded mb-4" />
      <h1 className="t-display text-2xl mb-5">Catalogue</h1>

      <div className="flex gap-1.5 mb-6 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm t-display tracking-wide -mb-px border-b-2 transition-colors ${
              tab === t ? 'border-amber text-chrome' : 'border-transparent text-steel hover:text-chrome'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Categories' && <TaxonomyManager table="categories" />}
      {tab === 'Brands' && <TaxonomyManager table="brands" />}

      {tab === 'Products' && (
        <>
          <div className="flex flex-col lg:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or SKU…"
                className="w-full rounded pl-9 pr-3 py-2 text-sm"
              />
            </div>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded px-3 py-2 text-sm">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="rounded px-3 py-2 text-sm">
              <option value="">All brands</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button
              onClick={() => { setEditing(null); setShowForm(true) }}
              className="flex items-center justify-center gap-1.5 bg-amber text-ink t-display px-4 py-2 rounded"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-steel text-sm py-16 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-steel">
              <p className="text-sm">No products yet.</p>
              <p className="text-xs mt-1">Add your first part to start filling the catalogue.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((p) => (
                <div key={p.id} className="flex items-center gap-3 bg-panel border border-line rounded-lg p-3">
                  <div className="w-12 h-12 rounded bg-ink border border-line shrink-0 overflow-hidden flex items-center justify-center">
                    {p.image_urls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_urls[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageOff className="w-4 h-4 text-steel" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-chrome text-sm truncate">{p.name}</span>
                      {p.is_genuine && <ShieldCheck className="w-3.5 h-3.5 text-amber shrink-0" />}
                      {!p.is_active && <span className="text-[10px] t-display text-steel border border-line rounded px-1">HIDDEN</span>}
                    </div>
                    <div className="flex gap-2 text-[11px] t-data text-steel">
                      <span>{p.sku}</span><span>·</span><span>{p.categories?.name ?? '—'}</span>
                      <span>·</span>
                      <span className={(p.stock_qty ?? 0) === 0 ? 'text-bad' : 'text-steel'}>
                        {p.stock_qty ?? 0} in stock
                      </span>
                    </div>
                  </div>
                  <div className="t-data text-amber text-sm shrink-0">{currency}{Number(p.price).toFixed(2)}</div>
                  <button onClick={() => { setEditing(p); setShowForm(true) }} className="text-steel hover:text-chrome p-1.5"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => archive(p)} className="text-steel hover:text-bad p-1.5"><Archive className="w-4 h-4" /></button>
                </div>
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
        </>
      )}

      {showForm && (
        <ProductForm
          product={editing}
          categories={categories}
          brands={brands}
          currency={currency}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchProducts() }}
        />
      )}
    </div>
  )
}
