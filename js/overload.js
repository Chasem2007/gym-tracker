/*
  =============================================
  overload.js — PROGRESSIVE OVERLOAD COACH (PRO)
  =============================================
  Shows a "Last time" hint below each exercise
  header when logging a workout, suggesting a
  progressive overload target for today's session.
  =============================================
*/

// Queries Supabase for the most recent previous workout containing
// the given exercise, returning { date, bestSet: { weight, reps } } or null.
async function getLastSessionData(exerciseName) {
  const today = document.getElementById('workoutDate')?.value || new Date().toISOString().slice(0, 10);

  const { data, error } = await db
    .from('workouts')
    .select('date, exercises')
    .eq('user_id', currentUser.user_id)
    .lt('date', today)
    .order('date', { ascending: false })
    .limit(50);

  if (error || !data) return null;

  for (const workout of data) {
    const exercises = typeof workout.exercises === 'string'
      ? JSON.parse(workout.exercises)
      : (workout.exercises || []);

    const match = exercises.find(ex =>
      ex.name && ex.name.toLowerCase() === exerciseName.toLowerCase()
    );
    if (!match) continue;

    const validSets = (match.sets || []).filter(
      s => parseFloat(s.weight) > 0 && parseFloat(s.reps) > 0
    );
    if (!validSets.length) continue;

    // Best set = highest weight; ties broken by most reps
    const bestSet = validSets.reduce((best, s) => {
      const w = parseFloat(s.weight), r = parseFloat(s.reps);
      const bw = parseFloat(best.weight), br = parseFloat(best.reps);
      if (w > bw) return s;
      if (w === bw && r > br) return s;
      return best;
    });

    return {
      date: workout.date,
      bestSet: { weight: parseFloat(bestSet.weight), reps: parseFloat(bestSet.reps) }
    };
  }

  return null;
}

// Returns a suggestion string based on last session's best set
function buildOverloadSuggestion(bestSet) {
  const { weight, reps } = bestSet;
  if (reps >= 5) return `Try <strong>${weight + 5} lbs</strong> today`;
  if (reps > 0)  return `Try <strong>${weight + 2.5} lbs</strong> today`;
  return `Try <strong>${reps + 1} reps</strong> at ${weight} lbs`;
}

// Formats YYYY-MM-DD as "Mar 28"
function formatOverloadDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Fetches last session data and injects a hint div after the exercise header.
async function renderOverloadHint(exIdx, exerciseName) {
  if (!isPro()) return;

  const hintId = `overload-hint-${exIdx}`;
  const existing = document.getElementById(hintId);
  if (existing) existing.remove();

  const lastSession = await getLastSessionData(exerciseName);
  if (!lastSession) return;

  const { date, bestSet } = lastSession;
  const hint = document.createElement('div');
  hint.id = hintId;
  hint.className = 'overload-hint';
  hint.innerHTML = `📈 Last: ${formatOverloadDate(date)} — ${bestSet.weight} lbs × ${bestSet.reps} &nbsp;→&nbsp; ${buildOverloadSuggestion(bestSet)}`;

  const entries = document.querySelectorAll('.exercise-entry');
  const entry = entries[exIdx];
  if (!entry) return;

  const header = entry.querySelector('.exercise-entry-header');
  if (header) header.insertAdjacentElement('afterend', hint);
}
