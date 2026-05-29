export interface OrderItem {
  id?: string
  order_id?: string
  item_name: string
  item_price: number
  quantity: number
  category: string
  created_at?: string
}

export interface Order {
  id: string
  table_number: string
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export type OrderStatus = Order['status']
