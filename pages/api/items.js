import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabase-admin';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { data, error } = await supabase
          .from('items')
          .select(`
            *,
            category:categories(*)
          `)
          .order('name', { ascending: true })
          .order('name', { referencedTable: 'categories', ascending: true });

        if (error) throw error;
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }

    case 'POST':
      try {
        const { name, category_id, price, has_custom_price, image_url, is_active } = req.body;

        if (!name || !category_id) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate that if has_custom_price is false, price must be provided
        if (!has_custom_price && (price === undefined || price === null)) {
          return res.status(400).json({ error: 'Price is required for non-custom-price items' });
        }

        const { data, error } = await supabaseAdmin
          .from('items')
          .insert([{ 
            name, 
            category_id, 
            price: has_custom_price ? null : price, 
            has_custom_price: has_custom_price || false, 
            image_url: image_url || null,
            is_active: is_active !== undefined ? is_active : true
          }])
          .select(`
            *,
            category:categories(*)
          `)
          .single();

        if (error) throw error;
        return res.status(201).json(data);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }

    case 'PUT':
      try {
        const { id, name, category_id, price, has_custom_price, image_url, is_active } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Item ID is required' });
        }

        // Check if this is a simple is_active toggle (only id and is_active provided)
        const isActiveToggleOnly = is_active !== undefined && !name && !category_id;

        // Validate that if has_custom_price is false, price must be provided
        // Skip validation if this is just an is_active toggle
        if (!isActiveToggleOnly && !has_custom_price && (price === undefined || price === null)) {
          return res.status(400).json({ error: 'Price is required for non-custom-price items' });
        }

        // Build update data based on what's provided
        const updateData = {};
        
        if (is_active !== undefined) {
          updateData.is_active = is_active;
        }
        
        // Only include other fields if this is not just an is_active toggle
        if (!isActiveToggleOnly) {
          updateData.name = name;
          updateData.category_id = category_id;
          updateData.price = has_custom_price ? null : price;
          updateData.has_custom_price = has_custom_price || false;
          updateData.image_url = image_url || null;
        }

        const { data, error } = await supabaseAdmin
          .from('items')
          .update(updateData)
          .eq('id', id)
          .select(`
            *,
            category:categories(*)
          `)
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
          return res.status(400).json({ error: 'Item ID is required' });
        }

        const { error } = await supabaseAdmin
          .from('items')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return res.status(204).end();
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
