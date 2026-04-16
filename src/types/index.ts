export interface Profile {
  id: string
  role: 'producer' | 'seller' | 'consumer'
  name: string
  store_name?: string
  created_at: string
}

export interface Product {
  id: string
  producer_id: string
  name: string
  description?: string
  image_url?: string
  wholesale_price: number
  created_at: string
}

export interface Gonggu {
  id: string
  seller_id: string
  product_id: string
  title: string
  sale_price: number
  min_quantity: number
  current_quantity: number
  deadline: string
  status: 'open' | 'closed' | 'cancelled'
  created_at: string
  products?: Product
}

export interface Order {
  id: string
  gonggu_id: string
  consumer_name: string
  consumer_phone: string
  quantity: number
  total_price: number
  created_at: string
}
