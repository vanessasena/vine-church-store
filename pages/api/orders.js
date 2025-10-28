import { supabaseAdmin } from '../../lib/supabase-admin';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { page = '1', limit = '10', startDate, endDate } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        // Build query
        let query = supabaseAdmin
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              item:items (
                *,
                category:categories(*)
              )
            )
          `, { count: 'exact' });

        // Apply date filters
        if (startDate) {
          query = query.gte('created_at', startDate);
        }
        if (endDate) {
          // Add one day to endDate to include the entire day
          const endDateTime = new Date(endDate);
          endDateTime.setDate(endDateTime.getDate() + 1);
          query = query.lt('created_at', endDateTime.toISOString());
        }

        // Apply ordering and pagination
        query = query
          .order('created_at', { ascending: false })
          .range(offset, offset + limitNum - 1);

        const { data, error, count } = await query;

        if (error) throw error;
        
        return res.status(200).json({
          orders: data,
          totalCount: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum)
        });
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
        const { data: orderData, error: orderError } = await supabaseAdmin
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
          price_at_time: item.price
        }));

        const { error: itemsError } = await supabaseAdmin
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Fetch complete order data
        const { data: completeOrder, error: fetchError } = await supabaseAdmin
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              item:items (
                *,
                category:categories(*)
              )
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

        const { data, error } = await supabaseAdmin
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

    case 'PATCH':
      try {
        const { id, items } = req.body;

        if (!id || !items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ error: 'Order ID and items are required' });
        }

        // Check if order is paid
        const { data: orderCheck, error: checkError } = await supabaseAdmin
          .from('orders')
          .select('is_paid')
          .eq('id', id)
          .single();

        if (checkError) throw checkError;

        if (orderCheck.is_paid) {
          return res.status(400).json({ error: 'Cannot edit paid orders' });
        }

        // Calculate new total cost
        const total_cost = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Update order total
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({ total_cost })
          .eq('id', id);

        if (updateError) throw updateError;

        // Delete existing order items
        const { error: deleteError } = await supabaseAdmin
          .from('order_items')
          .delete()
          .eq('order_id', id);

        if (deleteError) throw deleteError;

        // Create new order items
        const orderItems = items.map(item => ({
          order_id: id,
          item_id: item.id || null,
          quantity: item.quantity,
          item_name_at_time: item.name,
          price_at_time: item.price
        }));

        const { error: itemsError } = await supabaseAdmin
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Fetch complete order data
        const { data: completeOrder, error: fetchError } = await supabaseAdmin
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              item:items (
                *,
                category:categories(*)
              )
            )
          `)
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        return res.status(200).json(completeOrder);
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
        const { error: itemsError } = await supabaseAdmin
          .from('order_items')
          .delete()
          .eq('order_id', id);

        if (itemsError) throw itemsError;

        // Delete order
        const { error: orderError } = await supabaseAdmin
          .from('orders')
          .delete()
          .eq('id', id);

        if (orderError) throw orderError;

        return res.status(204).end();
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
