import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (error) throw error;
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }

    case 'POST':
      try {
        const { name } = req.body;

        if (!name || !name.trim()) {
          return res.status(400).json({ error: 'Category name is required' });
        }

        const { data, error } = await supabase
          .from('categories')
          .insert([{ name: name.trim() }])
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json(data);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          return res.status(400).json({ error: 'Category already exists' });
        }
        return res.status(500).json({ error: error.message });
      }

    case 'PUT':
      try {
        const { id, name } = req.body;

        if (!id || !name || !name.trim()) {
          return res.status(400).json({ error: 'Category ID and name are required' });
        }

        const { data, error } = await supabase
          .from('categories')
          .update({ name: name.trim() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json(data);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          return res.status(400).json({ error: 'Category already exists' });
        }
        return res.status(500).json({ error: error.message });
      }

    case 'DELETE':
      try {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ error: 'Category ID is required' });
        }

        // Check if category is being used by any items
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('id')
          .eq('category_id', id)
          .limit(1);

        if (itemsError) throw itemsError;

        if (items && items.length > 0) {
          return res.status(400).json({ error: 'Cannot delete category that is being used by items' });
        }

        const { error } = await supabase
          .from('categories')
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
