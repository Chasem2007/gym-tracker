// pages/api/workouts/add.js
// This file handles adding a new workout
// What it does: Takes workout data, saves to database, returns the saved workout

import { getServiceRoleClient } from '../../../lib/supabase';
import { withAuth } from '../../../lib/auth-middleware';

async function handler(req, res) {
  // Only accept POST requests (we're adding data)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, exercises, caloriesBurned } = req.body;
  const userId = req.user.userId; // From the auth middleware

  // Validate input
  if (!date || !exercises || exercises.length === 0) {
    return res.status(400).json({ error: 'Date and exercises required' });
  }

  try {
    const supabase = getServiceRoleClient();

    // Step 1: Create the workout
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert([
        {
          user_id: userId,
          date,
          calories_burned: caloriesBurned
        }
      ])
      .select()
      .single();

    if (workoutError) throw workoutError;

    // Step 2: Add each exercise to the workout
    for (const exercise of exercises) {
      // Add the exercise
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .insert([
          {
            workout_id: workout.id,
            name: exercise.name,
            weight_lbs: exercise.weight,
            reps: exercise.reps,
            sets: exercise.sets
          }
        ])
        .select()
        .single();

      if (exerciseError) throw exerciseError;

      // Step 3: Add muscle groups for this exercise
      if (exercise.muscles && exercise.muscles.length > 0) {
        const muscleInserts = exercise.muscles.map(muscle => ({
          exercise_id: exerciseData.id,
          muscle_group: muscle
        }));

        const { error: muscleError } = await supabase
          .from('exercise_muscles')
          .insert(muscleInserts);

        if (muscleError) throw muscleError;
      }
    }

    // Return success with the created workout
    return res.status(201).json({
      success: true,
      message: 'Workout logged successfully',
      workout: {
        id: workout.id,
        date: workout.date,
        caloriesBurned: workout.calories_burned,
        exercises
      }
    });
  } catch (error) {
    console.error('Add workout error:', error);
    return res.status(500).json({ error: 'Failed to log workout' });
  }
}

// Wrap with authentication middleware
export default withAuth(handler);
