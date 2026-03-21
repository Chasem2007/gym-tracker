// pages/api/auth/login.js
// This file handles user login
// What it does: Takes username/password, checks if correct, returns a token

import { getServiceRoleClient } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Only accept POST requests (we're sending data)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // Check if username and password were provided
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    // Get the database client
    const supabase = getServiceRoleClient();

    // Look up the user in the database by username
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single(); // Get exactly one result

    // If user not found or database error
    if (queryError || !users) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare the password they typed with the hashed password in database
    // bcrypt.compare() returns true if passwords match
    const passwordMatch = await bcrypt.compare(password, users.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Password is correct! Create a JWT token
    // A JWT is like a tamper-proof ID card that proves they're logged in
    const token = jwt.sign(
      {
        userId: users.id,
        username: users.username,
        role: users.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' } // Token expires in 7 days
    );

    // Set the token in a secure cookie
    // httpOnly means JavaScript can't access it (more secure)
    res.setHeader(
      'Set-Cookie',
      `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`
    );

    // Send back the user info (but NOT the password!)
    return res.status(200).json({
      success: true,
      user: {
        id: users.id,
        username: users.username,
        role: users.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
