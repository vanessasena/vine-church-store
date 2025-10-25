import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { resend } from '../../lib/resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { requestId, action, adminNotes } = req.body;

    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid request. requestId and action (approve/reject) are required' });
    }

    // Get the access request
    const { data: accessRequest, error: fetchError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !accessRequest) {
      return res.status(404).json({ error: 'Access request not found' });
    }

    if (accessRequest.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been reviewed' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update access request status
    const { error: updateError } = await supabase
      .from('access_requests')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating access request:', updateError);
      return res.status(500).json({ error: 'Failed to update access request' });
    }

    if (action === 'approve') {
      // Create user in Supabase Auth
      try {
        const temporaryPassword = generateTemporaryPassword();
        
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: accessRequest.email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            full_name: accessRequest.full_name,
          },
        });

        if (authError) {
          console.error('Error creating user:', authError);
          return res.status(500).json({ error: 'Failed to create user account' });
        }

        // Send welcome email with credentials
        try {
          await resend.emails.send({
            from: 'Vine Church Store <onboarding@resend.dev>',
            to: accessRequest.email,
            subject: 'Welcome to Vine Church Store - Account Approved',
            html: `
              <h2>Welcome to Vine Church Store!</h2>
              <p>Hello ${accessRequest.full_name},</p>
              <p>Your access request has been approved. You can now access the Vine Church Store management system.</p>
              <br/>
              <p><strong>Your login credentials:</strong></p>
              <p>Email: ${accessRequest.email}</p>
              <p>Temporary Password: ${temporaryPassword}</p>
              <br/>
              <p><strong>Important:</strong> Please change your password after your first login.</p>
              <p>You can log in at: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login">Login Page</a></p>
              <br/>
              <p>If you have any questions, please contact the administrator.</p>
            `,
          });
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
          // User is created but email failed - admin should manually send credentials
          return res.status(201).json({ 
            message: 'User created successfully, but email notification failed. Please manually send credentials.',
            user: authData.user,
            temporaryPassword 
          });
        }

        return res.status(200).json({ 
          message: 'Access request approved and user account created successfully',
          user: authData.user 
        });
      } catch (error) {
        console.error('Error in user creation process:', error);
        return res.status(500).json({ error: 'Failed to create user account' });
      }
    } else {
      // Send rejection email
      try {
        await resend.emails.send({
          from: 'Vine Church Store <onboarding@resend.dev>',
          to: accessRequest.email,
          subject: 'Access Request Update - Vine Church Store',
          html: `
            <h2>Access Request Update</h2>
            <p>Hello ${accessRequest.full_name},</p>
            <p>We regret to inform you that your access request to Vine Church Store has been declined.</p>
            ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
            <br/>
            <p>If you believe this is an error, please contact the administrator.</p>
          `,
        });
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
      }

      return res.status(200).json({ message: 'Access request rejected' });
    }
  } catch (error) {
    console.error('Error in approve request handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to generate a temporary password
function generateTemporaryPassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
