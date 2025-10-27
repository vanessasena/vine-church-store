export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export interface Item {
  id: string;
  name: string;
  category_id: string;
  price: number | null;
  has_custom_price: boolean;
  created_at?: string;
  category?: Category;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  price_at_time: number;
  item_name_at_time: string;
  item?: Item;
}

export interface Order {
  id: string;
  customer_name: string;
  total_cost: number;
  is_paid: boolean;
  payment_type?: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

export interface AccessRequest {
  id: string;
  email: string;
  full_name: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}
