import { createClient } from '@/lib/supabase/client'
import type { Product } from './types'

// Storefront only ever shows active, non-deleted products. We do NOT join
// branch_stock here — that table is staff-only under RLS, and customers don't
// need exact counts. Stock is validated server-side at checkout (Phase 4).

const SELECT = '*, categories(name), brands(name)'

export type PublicFilter = {
  search?: string
  categorySlug?: string
  brandSlug?: string
  page?: number
  pageSize?: number
}

// Browser-side (filters, search) — uses the anon client.
export async function listPublicProducts(f: PublicFilter): Promise<{ rows: Product[]; count: number }> {
  const page = f.page ?? 1
  const size = f.pageSize ?? 12
  const from = (page - 1) * size
  const to = from + size - 1
  const sb = createClient()

  let q = sb.from('products').select(SELECT, { count: 'exact' })
    .eq('is_active', true).eq('is_deleted', false)

  if (f.search?.trim()) {
    const s = f.search.trim().replace(/[%,]/g, '')
    q = q.or(`name.ilike.%${s}%,sku.ilike.%${s}%,vehicle_fit.ilike.%${s}%`)
  }
  if (f.categorySlug) {
    const { data: cat } = await sb.from('categories').select('id').eq('slug', f.categorySlug).maybeSingle()
    if (cat) q = q.eq('category_id', cat.id)
  }
  if (f.brandSlug) {
    const { data: br } = await sb.from('brands').select('id').eq('slug', f.brandSlug).maybeSingle()
    if (br) q = q.eq('brand_id', br.id)
  }

  const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to)
  if (error) throw error
  return { rows: (data as Product[]) ?? [], count: count ?? 0 }
}

export async function listFeatured(limit = 8): Promise<Product[]> {
  const sb = createClient()
  const { data } = await sb.from('products').select(SELECT)
    .eq('is_active', true).eq('is_deleted', false)
    .order('created_at', { ascending: false }).limit(limit)
  return (data as Product[]) ?? []
}

// All active products (for the category-grouped browse view). Capped for safety.
export async function listAllPublicProducts(): Promise<Product[]> {
  const sb = createClient()
  const { data } = await sb.from('products').select(SELECT)
    .eq('is_active', true).eq('is_deleted', false)
    .order('name').limit(300)
  return (data as Product[]) ?? []
}
