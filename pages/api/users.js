import { supabaseAdmin } from '../../lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // GET: Fetch user permissions
    if (req.method === 'GET') {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, role, orders_permission, created_at, updated_at')
        .eq('email', email)
        .single();

      if (error) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(data);
    }

    // POST: Create new user record (called during signup or admin creation)
    if (req.method === 'POST') {
      const { user_id, email, role = 'member', orders_permission = false } = req.body;

      if (!user_id || !email) {
        return res.status(400).json({ error: 'user_id and email are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          id: user_id,
          email,
          role,
          orders_permission,
        })
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(201).json(data);
    }

    // PUT: Update user permissions
    if (req.method === 'PUT') {
      const { email, orders_permission, role } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const updateData = { updated_at: new Date().toISOString() };
      if (typeof orders_permission === 'boolean') {
        updateData.orders_permission = orders_permission;
      }
      if (role) {
        updateData.role = role;
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('email', email)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json(data);
    }
  } catch (error) {
    console.error('User API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
