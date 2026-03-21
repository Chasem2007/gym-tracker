// lib/auth-middleware.js
// This file checks if a user is logged in and authenticated
// Think of it as a "bouncer" for your API routes - only lets in valid requests

import jwt from 'jsonwebtoken';

// This function verifies the JWT token from the cookie
// Returns the user info if valid, null if invalid
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded; // Returns { userId, username, role }
  } catch (error) {
    return null; // Token is invalid or expired
  }
}

// This is a middleware function for API routes
// Use it at the top of your API route to protect it
export function withAuth(handler) {
  return async (req, res) => {
    // Get the token from the cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify the token
    const user = verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Add the user to the request so the handler can use it
    req.user = user;

    // Call the actual handler function
    return handler(req, res);
  };
}

// Similar to withAuth, but only lets admins through
export function withAdminAuth(handler) {
  return async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    return handler(req, res);
  };
}
