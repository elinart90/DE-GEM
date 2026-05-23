export type Branch = {
  id: string
  name: string
  region: string
  town: string | null
  phone: string | null
  whatsapp: string | null
  is_main: boolean
  is_active: boolean
}

export type OrderItem = {
  id: string
  product_name: string
  unit_price: number
  quantity: number
}

export type Order = {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method: string | null
  subtotal: number
  delivery_fee: number
  total: number
  customer_region: string | null
  delivery_address: string | null
  notes: string | null
  created_at: string
  customers?: { name: string; phone: string; email: string | null; region?: string | null; address?: string | null } | null
  order_items?: OrderItem[]
}

export type Category = {
  id: string
  name: string
  slug: string
  is_deleted: boolean
  created_at: string
}

export type Brand = {
  id: string
  name: string
  slug: string
  is_deleted: boolean
  created_at: string
}

export type Product = {
  id: string
  name: string
  sku: string
  description: string | null
  category_id: string | null
  brand_id: string | null
  price: number
  image_urls: string[] | null
  vehicle_fit: string | null
  is_genuine: boolean
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  // embedded on read:
  categories?: { name: string } | null
  brands?: { name: string } | null
  stock_qty?: number   // main-branch quantity, attached by listProducts
}

// A product row joined with its stock at the main branch (for the Inventory view)
export type InventoryRow = Product & {
  stock_qty: number
  low_stock_at: number
}
