import { supabase } from '../../lib/supabase';
import { resend, ADMIN_EMAIL } from '../../lib/resend';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Create a new access request
    try {
      const { email, full_name, reason } = req.body;

      if (!email || !full_name) {
        return res.status(400).json({ error: 'Email and full name are required' });
      }

      // Check if request already exists
      const { data: existing, error: checkError } = await supabase
        .from('access_requests')
        .select('*')
        .eq('email', email)
        .single();

      if (existing) {
        return res.status(400).json({ 
          error: 'An access request already exists for this email. Please wait for admin approval.' 
        });
      }

      // Create access request
      const { data, error } = await supabase
        .from('access_requests')
        .insert([{ email, full_name, reason }])
        .select()
        .single();

      if (error) {
        console.error('Error creating access request:', error);
        return res.status(500).json({ error: 'Failed to create access request' });
      }

      // Send email notification to admin
      try {
        await resend.emails.send({
          from: 'Vine Church Store <onboarding@resend.dev>',
          to: ADMIN_EMAIL,
          subject: 'New Access Request - Vine Church Store',
          html: `
            <h2>New Access Request</h2>
            <p><strong>Name:</strong> ${full_name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Reason:</strong> ${reason || 'Not provided'}</p>
            <p><strong>Request Date:</strong> ${new Date(data.created_at).toLocaleString()}</p>
            <br/>
            <p>Please review and approve/reject this request in the admin panel.</p>
          `,
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the request if email fails - the admin can still see the request in the database
      }

      return res.status(201).json(data);
    } catch (error) {
      console.error('Error in access request handler:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    // Get all access requests (for admin panel)
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching access requests:', error);
        return res.status(500).json({ error: 'Failed to fetch access requests' });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error in access request handler:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
