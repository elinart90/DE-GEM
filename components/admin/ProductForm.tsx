'use client'
import { useState } from 'react'
import Modal, { Field } from './Modal'
import {
  saveProduct, uploadProductImage, type ProductInput,
} from '@/lib/queries'
import type { Brand, Category, Product } from '@/lib/types'
import { Loader2, Save, Upload, X, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = 'w-full rounded px-3 py-2 text-sm'

export default function ProductForm({
  product,
  categories,
  brands,
  currency,
  onClose,
  onSaved,
}: {
  product: Product | null
  categories: Category[]
  brands: Brand[]
  currency: string
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(product?.name ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [brandId, setBrandId] = useState(product?.brand_id ?? '')
  const [vehicleFit, setVehicleFit] = useState(product?.vehicle_fit ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [isGenuine, setIsGenuine] = useState(product?.is_genuine ?? false)
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [images, setImages] = useState<string[]>(product?.image_urls ?? [])
  const [openingStock, setOpeningStock] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const f of Array.from(files)) urls.push(await uploadProductImage(f))
      setImages((prev) => [...prev, ...urls])
    } catch (err: any) {
      toast.error(err?.message?.includes('Bucket') ? 'Create the product-images bucket first (supabase/storage.sql)' : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function submit() {
    if (!name.trim() || !sku.trim() || !price) {
      toast.error('Name, SKU and price are required')
      return
    }
    const payload: ProductInput = {
      id: product?.id,
      name, sku,
      price: parseFloat(price),
      category_id: categoryId || null,
      brand_id: brandId || null,
      vehicle_fit: vehicleFit.trim() || null,
      description: description.trim() || null,
      is_genuine: isGenuine,
      is_active: isActive,
      image_urls: images,
      opening_stock: product ? undefined : (openingStock ? parseInt(openingStock, 10) : 0),
    }
    setSaving(true)
    try {
      await saveProduct(payload)
      toast.success(product ? 'Product updated' : 'Product added')
      onSaved()
    } catch (err: any) {
      toast.error(err?.code === '23505' ? 'That SKU already exists' : (err?.message ?? 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={product ? 'Edit Product' : 'New Product'}
      onClose={onClose}
      footer={
        <button
          onClick={submit}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-amber hover:bg-amber/90 disabled:opacity-60 text-ink t-display py-2.5 rounded"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {product ? 'Save changes' : 'Add product'}
        </button>
      }
    >
      <Field label="Name">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Bosch Oil Filter" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="SKU">
          <input className={`${inputCls} t-data`} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="BOS-OF-001" />
        </Field>
        <Field label={`Price (${currency})`}>
          <input className={`${inputCls} t-data`} type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">—</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Brand">
          <select className={inputCls} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            <option value="">—</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Vehicle fitment (optional)">
        <input className={inputCls} value={vehicleFit} onChange={(e) => setVehicleFit(e.target.value)} placeholder="Toyota Corolla 2008–2013" />
      </Field>

      {!product && (
        <Field label="Opening stock — main branch">
          <input
            className={`${inputCls} t-data`}
            type="number"
            min="0"
            value={openingStock}
            onChange={(e) => setOpeningStock(e.target.value)}
            placeholder="0"
          />
          <span className="block text-steel text-[11px] mt-1">
            Logged as a stock-in. Adjust later under Inventory.
          </span>
        </Field>
      )}

      <Field label="Description (optional)">
        <textarea className={`${inputCls} min-h-[72px]`} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>

      <Field label="Images">
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((url) => (
            <div key={url} className="relative w-16 h-16 rounded overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => setImages((p) => p.filter((u) => u !== url))}
                className="absolute top-0 right-0 bg-black/70 p-0.5"
              >
                <X className="w-3 h-3 text-chrome" />
              </button>
            </div>
          ))}
          <label className="w-16 h-16 rounded border border-dashed border-line flex items-center justify-center cursor-pointer hover:border-amber">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-steel" /> : <Upload className="w-4 h-4 text-steel" />}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </Field>

      <div className="flex items-center gap-6 mt-2">
        <button onClick={() => setIsGenuine((v) => !v)} className="flex items-center gap-2 text-sm">
          <span className={`w-4 h-4 rounded-sm border flex items-center justify-center ${isGenuine ? 'bg-amber border-amber' : 'border-line'}`}>
            {isGenuine && <ShieldCheck className="w-3 h-3 text-ink" />}
          </span>
          <span className="text-chrome">Genuine part</span>
        </button>
        <button onClick={() => setIsActive((v) => !v)} className="flex items-center gap-2 text-sm">
          <span className={`w-4 h-4 rounded-sm border ${isActive ? 'bg-ok border-ok' : 'border-line'}`} />
          <span className="text-chrome">Visible on storefront</span>
        </button>
      </div>
    </Modal>
  )
}
