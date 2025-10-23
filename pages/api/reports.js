import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    // Fetch all orders with their order items
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Aggregate by date
    const byDate = {};
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      if (!byDate[date]) {
        byDate[date] = { total: 0, count: 0 };
      }
      byDate[date].total += order.total_cost;
      byDate[date].count += 1;
    });

    // Aggregate by category
    const byCategory = {};
    orders.forEach(order => {
      if (order.order_items && order.order_items.length > 0) {
        order.order_items.forEach(item => {
          const category = item.item_category_at_time || 'Unknown';
          if (!byCategory[category]) {
            byCategory[category] = { total: 0, count: 0 };
          }
          byCategory[category].total += item.price_at_time * item.quantity;
          byCategory[category].count += item.quantity;
        });
      }
    });

    // Aggregate by payment type
    const byPaymentType = {
      'Paid': { total: 0, count: 0 },
      'Unpaid': { total: 0, count: 0 }
    };
    
    const byPaymentMethod = {};
    orders.forEach(order => {
      if (order.is_paid) {
        byPaymentType['Paid'].total += order.total_cost;
        byPaymentType['Paid'].count += 1;
        
        const paymentMethod = order.payment_type || 'Unknown';
        if (!byPaymentMethod[paymentMethod]) {
          byPaymentMethod[paymentMethod] = { total: 0, count: 0 };
        }
        byPaymentMethod[paymentMethod].total += order.total_cost;
        byPaymentMethod[paymentMethod].count += 1;
      } else {
        byPaymentType['Unpaid'].total += order.total_cost;
        byPaymentType['Unpaid'].count += 1;
      }
    });

    // Calculate overall totals
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_cost, 0);
    const totalOrders = orders.length;
    const paidOrders = orders.filter(o => o.is_paid).length;
    const unpaidOrders = orders.filter(o => !o.is_paid).length;

    return res.status(200).json({
      summary: {
        totalRevenue,
        totalOrders,
        paidOrders,
        unpaidOrders
      },
      byDate,
      byCategory,
      byPaymentType,
      byPaymentMethod
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
