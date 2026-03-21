// pages/api/weight/track.js
// This file handles weight tracking
// What it does: Saves your weight on a specific date and retrieves your weight history

import { getServiceRoleClient } from '../../../lib/supabase';
import { withAuth } from '../../../lib/auth-middleware';

async function handler(req, res) {
  const userId = req.user.userId;

  // Handle GET (retrieve weight history)
  if (req.method === 'GET') {
    try {
      const supabase = getServiceRoleClient();

      // Get all weight entries for this user, sorted by date (newest first)
      const { data: weights, error } = await supabase
        .from('weight_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      // Format for the chart (convert database column names to frontend names)
      const formattedWeights = weights.map(w => ({
        date: w.date,
        weight: w.weight_lbs
      }));

      return res.status(200).json({
        success: true,
        weights: formattedWeights
      });
    } catch (error) {
      console.error('Get weights error:', error);
      return res.status(500).json({ error: 'Failed to fetch weights' });
    }
  }

  // Handle POST (add new weight entry)
  if (req.method === 'POST') {
    const { date, weight } = req.body;

    if (!date || !weight) {
      return res.status(400).json({ error: 'Date and weight required' });
    }

    try {
      const supabase = getServiceRoleClient();

      // Check if there's already a weight entry for this date
      const { data: existing } = await supabase
        .from('weight_tracking')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      let result;

      if (existing) {
        // Update existing entry
        const { data, error } = await supabase
          .from('weight_tracking')
          .update({ weight_lbs: weight })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('weight_tracking')
          .insert([
            {
              user_id: userId,
              date,
              weight_lbs: weight
            }
          ])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return res.status(201).json({
        success: true,
        message: 'Weight recorded',
        weight: {
          date: result.date,
          weight: result.weight_lbs
        }
      });
    } catch (error) {
      console.error('Track weight error:', error);
      return res.status(500).json({ error: 'Failed to record weight' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
