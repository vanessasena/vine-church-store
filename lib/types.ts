export interface Item {
  id: string;
  name: string;
  category: string;
  price: number;
  created_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  price_at_time: number;
  item?: Item;
}

export interface Order {
  id: string;
  customer_name: string;
  total_cost: number;
  is_paid: boolean;
  created_at: string;
  order_items?: OrderItem[];
}
