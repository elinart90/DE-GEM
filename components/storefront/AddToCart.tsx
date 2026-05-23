'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/CartProvider'
import type { Product } from '@/lib/types'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AddToCart({ product }: { product: Product }) {
  const { add } = useCart()
  const router = useRouter()
  const [qty, setQty] = useState(1)

  function addToCart() {
    add({ id: product.id, name: product.name, sku: product.sku, price: Number(product.price), image: product.image_urls?.[0] ?? null }, qty)
    toast.success(`${qty} × ${product.name} added`)
  }
  function buyNow() {
    addToCart()
    router.push('/cart')
  }

  return (
    <div className="flex flex-col gap-3 mt-6">
      <div className="flex items-center gap-3">
        <span className="t-display text-xs tracking-widest text-steel">QTY</span>
        <div className="flex items-center border border-line rounded">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-steel hover:text-chrome"><Minus className="w-4 h-4" /></button>
          <span className="w-10 text-center t-data text-chrome">{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 text-steel hover:text-chrome"><Plus className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={addToCart} className="flex-1 flex items-center justify-center gap-2 border border-amber text-amber hover:bg-amber hover:text-ink t-display py-3 rounded transition-colors">
          <ShoppingCart className="w-4 h-4" /> Add to cart
        </button>
        <button onClick={buyNow} className="flex-1 bg-amber hover:bg-amber/90 text-ink t-display py-3 rounded transition-colors">
          Buy now
        </button>
      </div>
    </div>
  )
}
