// pages/api/workouts/index.js
// This file handles getting all workouts for the logged-in user
// What it does: Queries database and returns all workouts with exercises and muscle groups

import { getServiceRoleClient } from '../../../lib/supabase';
import { withAuth } from '../../../lib/auth-middleware';

async function handler(req, res) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user.userId; // From the auth middleware

  try {
    const supabase = getServiceRoleClient();

    // Get all workouts for this user, sorted by date (newest first)
    const { data: workouts, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (workoutError) throw workoutError;

    // For each workout, get its exercises and muscles
    const workoutsWithExercises = await Promise.all(
      workouts.map(async (workout) => {
        // Get exercises for this workout
        const { data: exercises, error: exerciseError } = await supabase
          .from('exercises')
          .select('*')
          .eq('workout_id', workout.id);

        if (exerciseError) throw exerciseError;

        // For each exercise, get its muscle groups
        const exercisesWithMuscles = await Promise.all(
          exercises.map(async (exercise) => {
            const { data: muscles, error: muscleError } = await supabase
              .from('exercise_muscles')
              .select('muscle_group')
              .eq('exercise_id', exercise.id);

            if (muscleError) throw muscleError;

            return {
              ...exercise,
              muscles: muscles.map(m => m.muscle_group)
            };
          })
        );

        return {
          ...workout,
          exercises: exercisesWithMuscles
        };
      })
    );

    return res.status(200).json({
      success: true,
      workouts: workoutsWithExercises
    });
  } catch (error) {
    console.error('Get workouts error:', error);
    return res.status(500).json({ error: 'Failed to fetch workouts' });
  }
}

export default withAuth(handler);
