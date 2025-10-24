import { supabase } from '../../lib/supabase';

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
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }

    case 'POST':
      try {
        const { name, category_id, price } = req.body;

        if (!name || !category_id || price === undefined) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data, error } = await supabase
          .from('items')
          .insert([{ name, category_id, price }])
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
        const { id, name, category_id, price } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Item ID is required' });
        }

        const { data, error } = await supabase
          .from('items')
          .update({ name, category_id, price })
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

        const { error } = await supabase
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
