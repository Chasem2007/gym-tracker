// pages/api/admin/members.js
// This file handles member management for super admin
// What it does: Lets admin add new members to the system

import { getServiceRoleClient } from '../../../lib/supabase';
import { withAdminAuth } from '../../../lib/auth-middleware';
import bcrypt from 'bcryptjs';

async function handler(req, res) {
  // Only POST requests allowed (to add new members)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, email } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const supabase = getServiceRoleClient();

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          username,
          email,
          password_hash: passwordHash,
          role: 'user'
        }
      ])
      .select()
      .single();

    if (insertError) {
      if (insertError.message.includes('duplicate')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      throw insertError;
    }

    // Success!
    return res.status(201).json({
      success: true,
      message: `Member ${username} added successfully`,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    return res.status(500).json({ error: 'Failed to add member' });
  }
}

export default withAdminAuth(handler);
