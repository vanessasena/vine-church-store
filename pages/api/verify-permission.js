import { supabaseAdmin } from '../../lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.slice(7);

    // Verify the token with Supabase
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user?.email) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user has orders_permission in the users table
    const { data: userRecord, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, orders_permission, created_at, updated_at')
      .eq('email', userData.user.email)
      .single();

    if (dbError) {
      return res.status(403).json({
        error: 'User record not found',
        hasPermission: false
      });
    }
    console.log('User record:', userRecord);
    if (!userRecord?.orders_permission) {
      return res.status(403).json({
        error: 'User does not have orders permission',
        hasPermission: false
      });
    }

    return res.status(200).json({
      user: userRecord,
      hasPermission: true
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
