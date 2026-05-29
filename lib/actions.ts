'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface OrderItem {
  item_name: string
  item_price: number
  quantity: number
  category: string
}

interface CreateOrderData {
  table_number: string
  total_amount: number
  notes?: string
  items: OrderItem[]
}

export async function createOrder(data: CreateOrderData) {
  const supabase = await createClient()
  
  // Create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_number: data.table_number,
      total_amount: data.total_amount,
      notes: data.notes || null,
      status: 'pending'
    })
    .select()
    .single()
  
  if (orderError) {
    console.error('Error creating order:', orderError)
    return { success: false, error: orderError.message }
  }
  
  // Create order items
  const orderItems = data.items.map(item => ({
    order_id: order.id,
    item_name: item.item_name,
    item_price: item.item_price,
    quantity: item.quantity,
    category: item.category
  }))
  
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
  
  if (itemsError) {
    console.error('Error creating order items:', itemsError)
    return { success: false, error: itemsError.message }
  }
  
  revalidatePath('/admin')
  return { success: true, order }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
  
  if (error) {
    console.error('Error updating order status:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin')
  revalidatePath('/kitchen')
  return { success: true }
}

export async function getOrders() {
  const supabase = await createClient()
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }
  
  return orders
}

export async function getActiveOrders() {
  const supabase = await createClient()
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .in('status', ['pending', 'preparing', 'ready'])
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching active orders:', error)
    return []
  }
  
  return orders
}
