import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              items (*)
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }

    case 'POST':
      try {
        const { customer_name, items } = req.body;

        if (!customer_name || !items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Calculate total cost
        const total_cost = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{ customer_name, total_cost, is_paid: false }])
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = items.map(item => ({
          order_id: orderData.id,
          item_id: item.id || null, // Allow null for custom items
          quantity: item.quantity,
          item_name_at_time: item.name,
          item_category_at_time: item.category || 'Unknown',
          price_at_time: item.price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Fetch complete order data
        const { data: completeOrder, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              items (*)
            )
          `)
          .eq('id', orderData.id)
          .single();

        if (fetchError) throw fetchError;

        return res.status(201).json(completeOrder);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }

    case 'PUT':
      try {
        const { id, is_paid, payment_type } = req.body;

        if (!id || is_paid === undefined) {
          return res.status(400).json({ error: 'Order ID and payment status are required' });
        }

        // If marking as paid, payment_type is required
        if (is_paid && !payment_type) {
          return res.status(400).json({ error: 'Payment type is required when marking as paid' });
        }

        // Prepare update object
        const updateData = { is_paid };
        if (is_paid) {
          updateData.payment_type = payment_type;
        } else {
          // Clear payment_type when marking as unpaid
          updateData.payment_type = null;
        }

        const { data, error } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }

    case 'DELETE':
      try {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ error: 'Order ID is required' });
        }

        // Delete order items first
        const { error: itemsError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', id);

        if (itemsError) throw itemsError;

        // Delete order
        const { error: orderError } = await supabase
          .from('orders')
          .delete()
          .eq('id', id);

        if (orderError) throw orderError;

        return res.status(204).end();
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
