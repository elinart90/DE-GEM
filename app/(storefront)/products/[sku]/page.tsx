import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getPublicProductBySku } from '@/lib/public-queries-server'
import AddToCart from '@/components/storefront/AddToCart'
import ProductGallery from '@/components/storefront/ProductGallery'
import PriceTag from '@/components/storefront/PriceTag'
import { ShieldCheck, ChevronLeft, Truck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { sku: string } }): Promise<Metadata> {
  const product = await getPublicProductBySku(decodeURIComponent(params.sku))
  if (!product) return { title: 'Part not found' }
  return {
    title: `${product.name} — Auto Supply`,
    description: product.description ?? `${product.name}. Genuine auto parts, delivered across Ghana.`,
  }
}

export default async function ProductDetail({ params }: { params: { sku: string } }) {
  const product = await getPublicProductBySku(decodeURIComponent(params.sku))
  if (!product) notFound()

  return (
    <main className="max-w-5xl mx-auto px-4 lg:px-6 py-8">
      <Link href="/products" className="inline-flex items-center gap-1 text-steel hover:text-chrome text-sm mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        <ProductGallery images={product.image_urls ?? []} name={product.name} />

        <div>
          <div className="t-display text-amber text-xs tracking-widest mb-2">
            {product.brands?.name ?? product.categories?.name ?? 'PART'}
          </div>
          <h1 className="t-display text-3xl mb-3">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <PriceTag amount={Number(product.price)} className="t-data text-2xl text-amber" />
            {product.is_genuine && (
              <span className="flex items-center gap-1 text-xs t-display text-amber border border-amber/40 rounded px-2 py-1">
                <ShieldCheck className="w-3.5 h-3.5" /> GENUINE
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm mb-2">
            <Row label="SKU" value={product.sku} mono />
            {product.categories?.name && <Row label="Category" value={product.categories.name} />}
            {product.vehicle_fit && <Row label="Fits" value={product.vehicle_fit} />}
          </div>

          {product.description && (
            <p className="text-steel text-sm leading-relaxed mt-4 border-t border-line pt-4">{product.description}</p>
          )}

          <AddToCart product={product} />

          <div className="flex items-center gap-2 text-steel text-xs mt-5">
            <Truck className="w-4 h-4 text-amber" /> Delivery available across all 16 regions.
          </div>
        </div>
      </div>
    </main>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="text-steel t-display text-xs tracking-wide w-20 shrink-0 pt-0.5">{label}</span>
      <span className={`text-chrome ${mono ? 't-data' : ''}`}>{value}</span>
    </div>
  )
}
