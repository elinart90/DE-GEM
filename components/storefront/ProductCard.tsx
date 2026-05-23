'use client'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import { useSetting } from '@/components/SettingsProvider'
import type { Product } from '@/lib/types'
import { ShieldCheck, Plus, ImageOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()
  const currency = useSetting('payment_currency', 'GH₵')

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault()
    add({ id: product.id, name: product.name, sku: product.sku, price: Number(product.price), image: product.image_urls?.[0] ?? null })
    toast.success(`${product.name} added`)
  }

  return (
    <Link
      href={`/products/${encodeURIComponent(product.sku)}`}
      className="group bg-panel border border-line rounded-lg overflow-hidden hover:border-steel transition-colors flex flex-col"
    >
      <div className="aspect-square bg-ink relative overflow-hidden">
        {product.image_urls?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><ImageOff className="w-7 h-7 text-line" /></div>
        )}
        {product.is_genuine && (
          <span className="absolute top-2 left-2 flex items-center gap-1 bg-ink/80 backdrop-blur px-1.5 py-0.5 rounded text-[10px] t-display text-amber">
            <ShieldCheck className="w-3 h-3" /> GENUINE
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="text-[10px] t-display tracking-widest text-steel mb-0.5">{product.brands?.name ?? product.categories?.name ?? 'PART'}</div>
        <div className="text-sm text-chrome leading-tight mb-2 line-clamp-2 flex-1">{product.name}</div>
        <div className="flex items-center justify-between">
          <span className="t-data text-amber">{currency}{Number(product.price).toFixed(2)}</span>
          <button onClick={quickAdd} className="w-7 h-7 rounded bg-panel2 hover:bg-amber hover:text-ink text-chrome flex items-center justify-center transition-colors" aria-label="Add to cart">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  )
}
