'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { menuData, GROUPS } from '@/lib/menu-data'

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

export async function seedMenuItems() {
  const supabase = await createClient()
  
  // Check if menu items already exist
  const { count } = await supabase
    .from('menu_items')
    .select('*', { count: 'exact', head: true })
  
  if (count && count > 0) {
    return { success: true, message: 'Menu items already seeded', count }
  }
  
  // Prepare menu items for insertion
  const menuItems: Array<{
    name: string
    name_am: string | null
    price: number
    category: string
    group_type: 'food' | 'drinks'
    description: string | null
    is_available: boolean
    sort_order: number
  }> = []
  
  let sortOrder = 0
  
  // Map categories to groups
  const categoryToGroup: Record<string, 'food' | 'drinks'> = {}
  GROUPS.forEach(group => {
    group.cats.forEach(cat => {
      categoryToGroup[cat] = group.id as 'food' | 'drinks'
    })
  })
  
  // Flatten menu data into items
  Object.entries(menuData).forEach(([categoryKey, category]) => {
    category.items.forEach(item => {
      menuItems.push({
        name: item.name,
        name_am: null,
        price: item.price,
        category: categoryKey === 'colddrinks' ? 'cold' : categoryKey === 'hotdrinks' ? 'hot' : categoryKey,
        group_type: categoryToGroup[categoryKey] || 'food',
        description: item.desc || null,
        is_available: true,
        sort_order: sortOrder++
      })
    })
  })
  
  // Insert all menu items
  const { error } = await supabase
    .from('menu_items')
    .insert(menuItems)
  
  if (error) {
    console.error('Error seeding menu items:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/menu-management')
  return { success: true, message: `Seeded ${menuItems.length} menu items`, count: menuItems.length }
}

export async function getMenuItems() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('group_type')
    .order('category')
    .order('sort_order')
  
  if (error) {
    console.error('Error fetching menu items:', error)
    return []
  }
  
  return data
}
