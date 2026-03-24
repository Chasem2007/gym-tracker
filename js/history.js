/*
  =============================================
  history.js — WORKOUT HISTORY
  =============================================
  Shows all past workouts in reverse chronological
  order with exercise details, sets, and total volume.
  =============================================
*/

async function loadHistory() {
  const { data } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', currentUser.user_id)
    .order('date', { ascending: false })
    .limit(50);

  const container = document.getElementById('workoutHistoryList');

  if (!data || !data.length) {
    container.innerHTML = '<div class="empty-state"><p>No workouts logged yet.</p></div>';
    return;
  }

  container.innerHTML = data.map(w => {
    const exs = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []);
    const dateStr = new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

    // Calculate total volume for this workout
    let totalVol = 0;
    const details = exs.map(ex => {
      const setsSummary = (ex.sets || []).map(s => {
        totalVol += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
        return `${s.weight || 0}×${s.reps || 0}`;
      }).join(', ');
      return `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
        <span style="color:var(--text-primary)">${ex.name}</span>
        <span style="color:var(--text-muted)">${setsSummary}</span>
      </div>`;
    }).join('');

    return `<div style="padding:16px;border-bottom:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div>
          <div style="font-weight:700;font-size:16px;">${w.name || 'Workout'}</div>
          <div style="font-size:12px;color:var(--text-muted);">${dateStr}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--accent);">${totalVol.toLocaleString()}</div>
          <div style="font-size:11px;color:var(--text-muted);">total lbs</div>
        </div>
      </div>
      ${w.notes ? `<div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;font-style:italic;">"${w.notes}"</div>` : ''}
      ${details}
      <div style="margin-top:8px;">
        <button class="btn btn-danger btn-sm" onclick="deleteWorkout(${w.id})">Delete</button>
      </div>
    </div>`;
  }).join('');
}

async function deleteWorkout(id) {
  if (!confirm('Delete this workout?')) return;
  await supabase.from('workouts').delete().eq('id', id);
  showToast('Deleted');
  loadHistory();
}
