import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Product } from './types'

const SELECT = '*, categories(name), brands(name)'

// Server-side (product detail page) — cookie-aware client, anon reads via RLS.
export async function getPublicProductBySku(sku: string): Promise<Product | null> {
  const sb = createClient()
  const { data } = await sb.from('products').select(SELECT)
    .eq('sku', sku).eq('is_active', true).eq('is_deleted', false).maybeSingle()
  return (data as Product) ?? null
}
