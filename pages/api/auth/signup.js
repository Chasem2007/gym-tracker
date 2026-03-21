// pages/api/auth/signup.js
// This file handles user signup
// What it does: Creates a new user account with hashed password

import { getServiceRoleClient } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, email } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const supabase = getServiceRoleClient();

    // Hash the password before storing it
    // This way, even if someone hacks the database, they can't read passwords
    const passwordHash = await bcrypt.hash(password, 10);

    // Try to create the user
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

    // Check if there was an error (usually means username already exists)
    if (insertError) {
      if (insertError.message.includes('duplicate')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      throw insertError;
    }

    // Success! User created
    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please log in.',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Server error during signup' });
  }
}
