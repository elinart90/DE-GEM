import { createClient } from '@/lib/supabase/client'
import type { Branch, Brand, Category, Product, InventoryRow } from './types'

const sb = () => createClient()

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ---------------------------------------------------------------- Branches
export async function listBranches(): Promise<Branch[]> {
  const { data, error } = await sb().from('branches').select('*').eq('is_active', true).order('is_main', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getMainBranchId(): Promise<string | null> {
  const { data } = await sb().from('branches').select('id').eq('is_main', true).limit(1).single()
  return data?.id ?? null
}

// ---------------------------------------------------------------- Taxonomy (categories/brands share shape)
export async function listCategories(): Promise<Category[]> {
  const { data, error } = await sb().from('categories').select('*').eq('is_deleted', false).order('name')
  if (error) throw error
  return data ?? []
}
export async function listBrands(): Promise<Brand[]> {
  const { data, error } = await sb().from('brands').select('*').eq('is_deleted', false).order('name')
  if (error) throw error
  return data ?? []
}
export async function saveTaxonomy(table: 'categories' | 'brands', name: string, id?: string) {
  const row = { name: name.trim(), slug: slugify(name) }
  const q = id
    ? sb().from(table).update(row).eq('id', id)
    : sb().from(table).insert(row)
  const { error } = await q
  if (error) throw error
}
export async function archiveTaxonomy(table: 'categories' | 'brands', id: string) {
  const { error } = await sb().from(table).update({ is_deleted: true }).eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------- Products
export type ProductFilter = {
  search?: string
  categoryId?: string
  brandId?: string
  page?: number
  pageSize?: number
}

export async function listProducts(f: ProductFilter): Promise<{ rows: Product[]; count: number }> {
  const page = f.page ?? 1
  const size = f.pageSize ?? 20
  const from = (page - 1) * size
  const to = from + size - 1
  const mainId = await getMainBranchId()

  let q = sb()
    .from('products')
    .select('*, categories(name), brands(name), branch_stock(quantity, branch_id)', { count: 'exact' })
    .eq('is_deleted', false)

  if (f.search?.trim()) {
    const s = f.search.trim().replace(/[%,]/g, '')
    q = q.or(`name.ilike.%${s}%,sku.ilike.%${s}%`)
  }
  if (f.categoryId) q = q.eq('category_id', f.categoryId)
  if (f.brandId) q = q.eq('brand_id', f.brandId)

  const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to)
  if (error) throw error
  const rows = (data ?? []).map((p: any) => ({
    ...p,
    stock_qty: (p.branch_stock ?? []).find((s: any) => s.branch_id === mainId)?.quantity ?? 0,
  })) as Product[]
  return { rows, count: count ?? 0 }
}

export type ProductInput = {
  id?: string
  name: string
  sku: string
  description: string | null
  category_id: string | null
  brand_id: string | null
  price: number
  image_urls: string[]
  vehicle_fit: string | null
  is_genuine: boolean
  is_active: boolean
  opening_stock?: number   // create-only: opening qty at the main branch
}

export async function saveProduct(p: ProductInput) {
  const row = {
    name: p.name.trim(),
    sku: p.sku.trim(),
    description: p.description,
    category_id: p.category_id,
    brand_id: p.brand_id,
    price: p.price,
    image_urls: p.image_urls,
    vehicle_fit: p.vehicle_fit,
    is_genuine: p.is_genuine,
    is_active: p.is_active,
  }

  if (p.id) {
    const { error } = await sb().from('products').update(row).eq('id', p.id)
    if (error) throw error
    return
  }

  // Create: insert, then log opening stock at the main branch (if any).
  const { data, error } = await sb().from('products').insert(row).select('id').single()
  if (error) throw error

  if (p.opening_stock && p.opening_stock > 0 && data?.id) {
    const branchId = await getMainBranchId()
    if (branchId) {
      await adjustStock({
        productId: data.id,
        branchId,
        newQty: p.opening_stock,
        changeType: 'stock_in',
        reason: 'Opening stock',
      })
    }
  }
}

export async function archiveProduct(id: string) {
  const { error } = await sb().from('products').update({ is_deleted: true }).eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------- Stock / inventory
export async function listInventory(branchId: string, search?: string): Promise<InventoryRow[]> {
  let q = sb()
    .from('products')
    .select('*, branch_stock(quantity, low_stock_at, branch_id)')
    .eq('is_deleted', false)
  if (search?.trim()) {
    const s = search.trim().replace(/[%,]/g, '')
    q = q.or(`name.ilike.%${s}%,sku.ilike.%${s}%`)
  }
  const { data, error } = await q.order('name')
  if (error) throw error
  return (data ?? []).map((p: any) => {
    const stock = (p.branch_stock ?? []).find((s: any) => s.branch_id === branchId)
    return { ...p, stock_qty: stock?.quantity ?? 0, low_stock_at: stock?.low_stock_at ?? 5 }
  })
}

// Set absolute quantity, compute the delta, and write an inventory log.
export async function adjustStock(opts: {
  productId: string
  branchId: string
  newQty: number
  changeType: 'stock_in' | 'adjustment' | 'damaged' | 'return'
  reason?: string
}) {
  const client = sb()
  const { data: existing } = await client
    .from('branch_stock')
    .select('quantity')
    .eq('product_id', opts.productId)
    .eq('branch_id', opts.branchId)
    .maybeSingle()

  const current = existing?.quantity ?? 0
  const delta = opts.newQty - current

  const { error: upErr } = await client
    .from('branch_stock')
    .upsert(
      { product_id: opts.productId, branch_id: opts.branchId, quantity: opts.newQty },
      { onConflict: 'product_id,branch_id' }
    )
  if (upErr) throw upErr

  if (delta !== 0) {
    const { data: { user } } = await client.auth.getUser()
    const { error: logErr } = await client.from('inventory_logs').insert({
      product_id: opts.productId,
      branch_id: opts.branchId,
      change_type: opts.changeType,
      qty_change: delta,
      reason: opts.reason ?? null,
      user_id: user?.id ?? null,
    })
    if (logErr) throw logErr
  }
}

// ---------------------------------------------------------------- Image upload
export async function uploadProductImage(file: File): Promise<string> {
  const client = sb()
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await client.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = client.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

// ---------------------------------------------------------------- Orders (admin)
import type { Order } from './types'

export const ORDER_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'] as const

export async function listOrders(opts: { status?: string; search?: string; page?: number; pageSize?: number }) {
  const page = opts.page ?? 1
  const size = opts.pageSize ?? 20
  const from = (page - 1) * size
  const to = from + size - 1

  let q = sb()
    .from('orders')
    .select('*, customers(name,phone,email), order_items(id)', { count: 'exact' })

  if (opts.status && opts.status !== 'all') q = q.eq('status', opts.status)
  if (opts.search?.trim()) {
    const s = opts.search.trim().replace(/[%,]/g, '')
    q = q.or(`order_number.ilike.%${s}%,customer_region.ilike.%${s}%`)
  }

  const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to)
  if (error) throw error
  return { rows: (data as Order[]) ?? [], count: count ?? 0 }
}

export async function getOrder(id: string): Promise<Order | null> {
  const { data, error } = await sb()
    .from('orders')
    .select('*, customers(name,phone,email,region,address), order_items(id,product_name,unit_price,quantity)')
    .eq('id', id).single()
  if (error) throw error
  return data as Order
}

export async function setOrderStatus(id: string, status: string) {
  const { error } = await sb().from('orders').update({ status }).eq('id', id)
  if (error) throw error
}

export async function setPaymentStatus(id: string, payment_status: string) {
  const { error } = await sb().from('orders').update({ payment_status }).eq('id', id)
  if (error) throw error
}

// Orders that still need attention (not delivered or cancelled).
export async function activeOrdersCount(): Promise<number> {
  const { count } = await sb().from('orders')
    .select('id', { count: 'exact', head: true })
    .not('status', 'in', '(delivered,cancelled)')
  return count ?? 0
}

// ---------------------------------------------------------------- Branches (admin)
export async function listAllBranches(): Promise<Branch[]> {
  const { data, error } = await sb().from('branches').select('*').order('is_main', { ascending: false }).order('name')
  if (error) throw error
  return data ?? []
}

export type BranchInput = {
  id?: string
  name: string
  region: string
  town: string | null
  phone: string | null
  whatsapp: string | null
  is_active: boolean
}

export async function saveBranch(b: BranchInput) {
  const row = { name: b.name.trim(), region: b.region, town: b.town, phone: b.phone, whatsapp: b.whatsapp, is_active: b.is_active }
  const q = b.id ? sb().from('branches').update(row).eq('id', b.id) : sb().from('branches').insert(row)
  const { error } = await q
  if (error) throw error
}

// Switch the main branch. Unset the current main first (a partial unique index
// allows only one is_main = true), then set the new one.
export async function setMainBranch(id: string) {
  const client = sb()
  const { error: e1 } = await client.from('branches').update({ is_main: false }).eq('is_main', true)
  if (e1) throw e1
  const { error: e2 } = await client.from('branches').update({ is_main: true }).eq('id', id)
  if (e2) throw e2
}
