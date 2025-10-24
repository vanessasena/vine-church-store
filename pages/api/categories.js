import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    // Fetch all items and extract distinct categories
    const { data, error } = await supabase
      .from('items')
      .select('category');

    if (error) throw error;

    // Extract unique categories and sort them
    const categories = Array.from(new Set(data.map(item => item.category)))
      .filter(category => category && category.trim() !== '')
      .sort();

    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
