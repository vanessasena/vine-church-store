import { supabaseAdmin } from '../../lib/supabase-admin';

// Admin-only endpoint for editing an order's customer name and date of
// purchase. Unlike the PATCH handler in /api/orders (which blocks paid
// orders and rebuilds order items), this allows editing these two fields
// on any order, including paid ones. It is intentionally separated from the
// normal order edit flow so admins don't change them by mistake.
export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { page = '1', limit = '10', customerName, sortOrder = 'desc' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        const normalizeString = (str) => {
          if (!str) return '';
          return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().trim();
        };

        let query = supabaseAdmin
          .from('orders')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: sortOrder === 'asc' });

        let data, count;
        if (customerName) {
          const { data: allData, error } = await query;
          if (error) throw error;

          const normalizedSearch = normalizeString(customerName);
          const filteredData = allData.filter(order =>
            normalizeString(order.customer_name).includes(normalizedSearch)
          );

          count = filteredData.length;
          data = filteredData.slice(offset, offset + limitNum);
        } else {
          query = query.range(offset, offset + limitNum - 1);
          const result = await query;
          if (result.error) throw result.error;
          data = result.data;
          count = result.count;
        }

        return res.status(200).json({
          orders: data,
          totalCount: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum),
        });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }

    case 'PATCH':
      try {
        const { id, customer_name, created_at } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Order ID is required' });
        }

        const orderUpdate = {};

        // Update customer name
        if (customer_name !== undefined) {
          const trimmedName = String(customer_name).trim();
          if (!trimmedName) {
            return res.status(400).json({ error: 'Customer name cannot be empty' });
          }
          orderUpdate.customer_name = trimmedName;
        }

        // Update date of purchase. The client sends a date-only string
        // (YYYY-MM-DD) from a native date input. Parsing it directly with
        // new Date() would treat it as UTC midnight, which converts to the
        // previous day in EST (UTC-4/5) and saves the wrong date. Instead,
        // parse the calendar components and anchor the time at noon EST so
        // the stored date always matches the selected day.
        if (created_at !== undefined && created_at !== null && created_at !== '') {
          const match = String(created_at).match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (!match) {
            return res.status(400).json({ error: 'Invalid date of purchase' });
          }
          const [, year, month, day] = match;
          const estDate = new Date(`${year}-${month}-${day}T12:00:00-05:00`);
          if (isNaN(estDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date of purchase' });
          }
          orderUpdate.created_at = estDate.toISOString();
        }

        if (Object.keys(orderUpdate).length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
        }

        const { data, error } = await supabaseAdmin
          .from('orders')
          .update(orderUpdate)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }

    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
