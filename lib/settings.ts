import { createClient } from '@/lib/supabase/client'

export type Setting = {
  key: string
  value: string | null
  label: string | null
  category: string | null
  type: string | null
  is_public: boolean
}

// Sensible defaults so the UI never renders blank while loading or if a key is missing.
export const DEFAULTS: Record<string, string> = {
  business_name:        'Auto Supply Co.',
  business_phone:       '+233000000000',
  business_whatsapp:    '233000000000',
  payment_currency:     'GH₵',
  delivery_fee_default: '30',
}

export async function getAllSettings(): Promise<Setting[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('settings').select('*').order('category')
  if (error) throw error
  return data ?? []
}

// Admin save — write many at once. Upsert on the primary key.
export async function updateSettings(updates: Record<string, string>): Promise<boolean> {
  const supabase = createClient()
  const rows = Object.entries(updates).map(([key, value]) => ({ key, value }))
  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
  return !error
}

// Delivery fee for a region, falling back to the default.
export async function getDeliveryFee(
  region: string,
  all: Record<string, string>
): Promise<number> {
  const key = `delivery_fee_${region.toLowerCase().replace(/\s+/g, '_')}`
  return parseFloat(all[key] ?? all['delivery_fee_default'] ?? DEFAULTS['delivery_fee_default'])
}
