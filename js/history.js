/*
  =============================================
  history.js — WORKOUT HISTORY (with editing)
  =============================================
  View past workouts, and edit any of them:
  change the name, date, notes, add/remove
  exercises, and modify sets/reps/weight.
  
  HOW EDITING WORKS:
  When you tap "Edit", the workout card transforms
  into an editable form (inline — no modal needed).
  The workout data is stored temporarily in
  window._editingWorkout. When you hit "Save Changes",
  it updates the row in Supabase.
  =============================================
*/

// Tracks which workout is currently being edited (null = none)
let editingWorkoutId = null;

async function loadHistory() {
  showLoading('workoutHistoryList');
  const { data } = await db
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

    return `<div id="history-item-${w.id}" style="padding:16px;border-bottom:1px solid var(--border);">
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
      ${isPro() ? `<div style="margin-top:10px;display:flex;gap:6px;">
        <button class="btn btn-secondary btn-sm" onclick="startEditWorkout(${w.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteWorkout(${w.id})">Delete</button>
      </div>` : `<div style="margin-top:10px;">
        <span style="font-size:11px;color:var(--text-muted);">
          <span style="color:var(--yellow);font-weight:600;">⚡ Pro</span> — Upgrade to edit &amp; delete workouts
        </span>
      </div>`}
    </div>`;
  }).join('');

  // Store workouts data so we can look them up for editing
  window._historyWorkouts = data;
}

// =============================================
// EDIT MODE — transforms a history card into
// an editable form right in place
// =============================================
function startEditWorkout(id) {
  const workouts = window._historyWorkouts || [];
  const workout = workouts.find(w => w.id === id);
  if (!workout) return;

  editingWorkoutId = id;

  // Parse exercises
  const exs = typeof workout.exercises === 'string'
    ? JSON.parse(workout.exercises)
    : (workout.exercises || []);

  // Store a working copy we can modify
  window._editData = {
    id: workout.id,
    name: workout.name || '',
    date: workout.date,
    notes: workout.notes || '',
    exercises: JSON.parse(JSON.stringify(exs))  // deep copy
  };

  renderEditForm();
}

function renderEditForm() {
  const data = window._editData;
  if (!data) return;

  const container = document.getElementById('history-item-' + data.id);
  if (!container) return;

  const exercisesHtml = data.exercises.map((ex, exIdx) => {
    const setsHtml = (ex.sets || []).map((s, sIdx) => `
      <div style="display:grid;grid-template-columns:20px 1fr 1fr 20px;gap:6px;margin-bottom:4px;align-items:center;">
        <div style="font-size:11px;color:var(--text-muted);text-align:center;">${sIdx + 1}</div>
        <input type="number" placeholder="lbs" value="${s.weight || ''}"
               class="set-input" onchange="editUpdateSet(${exIdx},${sIdx},'weight',this.value)">
        <input type="number" placeholder="reps" value="${s.reps || ''}"
               class="set-input" onchange="editUpdateSet(${exIdx},${sIdx},'reps',this.value)">
        <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;"
                onclick="editRemoveSet(${exIdx},${sIdx})">×</button>
      </div>
    `).join('');

    return `<div style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:4px;">
        <span style="font-weight:600;font-size:13px;min-width:0;word-break:break-word;">${ex.name}</span>
        <div style="display:flex;gap:4px;flex-shrink:0;">
          <button class="btn btn-ghost btn-sm" onclick="editAddSet(${exIdx})" style="padding:5px 10px;">+ Set</button>
          <button class="btn btn-danger btn-sm" onclick="editRemoveExercise(${exIdx})" style="padding:5px 10px;">×</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:20px 1fr 1fr 20px;gap:6px;margin-bottom:4px;">
        <div style="font-size:9px;color:var(--text-muted);text-align:center;">SET</div>
        <div style="font-size:9px;color:var(--text-muted);text-align:center;">WEIGHT</div>
        <div style="font-size:9px;color:var(--text-muted);text-align:center;">REPS</div>
        <div></div>
      </div>
      ${setsHtml}
    </div>`;
  }).join('');

  container.innerHTML = `
    <div style="background:var(--bg-card-hover);border-radius:10px;padding:12px;border:1px solid var(--accent);animation:fadeUp 0.2s ease;overflow:hidden;">
      <div style="margin-bottom:10px;">
        <span class="font-display" style="font-size:16px;font-weight:600;color:var(--accent);letter-spacing:0.5px;">EDITING WORKOUT</span>
      </div>
      <div class="form-row" style="margin-bottom:8px;">
        <div class="form-group" style="margin-bottom:0;">
          <label>Date</label>
          <input type="date" class="form-input" value="${data.date}" onchange="window._editData.date=this.value">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label>Session Name</label>
          <input type="text" class="form-input" value="${data.name}" placeholder="e.g. Push Day" onchange="window._editData.name=this.value">
        </div>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <input type="text" class="form-input" value="${data.notes}" placeholder="How'd it feel?" onchange="window._editData.notes=this.value">
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 8px;">
        <span style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;">Exercises</span>
        <button class="btn btn-primary btn-sm" onclick="editAddExercise()">+ Add Exercise</button>
      </div>
      ${exercisesHtml}
      ${data.exercises.length === 0 ? '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px;">No exercises — add one above</div>' : ''}
      ${data.exercises.length > 0 ? '<button class="btn btn-secondary w-full" onclick="editAddExercise()" style="justify-content:center;margin-top:8px;">+ Add Another Exercise</button>' : ''}
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn btn-primary" onclick="saveEditWorkout()" style="flex:1;justify-content:center;">Save Changes</button>
        <button class="btn btn-ghost" onclick="cancelEditWorkout()">Cancel</button>
      </div>
    </div>
  `;
}

// ===== Edit helper functions =====

function editUpdateSet(exIdx, sIdx, field, value) {
  window._editData.exercises[exIdx].sets[sIdx][field] = value;
}

function editAddSet(exIdx) {
  window._editData.exercises[exIdx].sets.push({ weight: '', reps: '' });
  renderEditForm();
}

function editRemoveSet(exIdx, sIdx) {
  window._editData.exercises[exIdx].sets.splice(sIdx, 1);
  // If no sets left, remove the exercise
  if (!window._editData.exercises[exIdx].sets.length) {
    window._editData.exercises.splice(exIdx, 1);
  }
  renderEditForm();
}

function editRemoveExercise(exIdx) {
  window._editData.exercises.splice(exIdx, 1);
  renderEditForm();
}

// Opens the exercise picker, but adds to the edit form instead of the log page
async function editAddExercise() {
  const exercises = await getExerciseLibrary();
  window._pickerExercises = exercises;

  const html = exercises.map((ex, idx) => `
    <div class="library-card exercise-edit-pick" style="cursor:pointer;padding:12px;" data-idx="${idx}">
      <div style="font-weight:600;font-size:14px;">${ex.name}</div>
      <div style="font-size:11px;color:var(--text-muted);">${ex.equipment || ''} — ${(ex.muscles || []).join(', ')}</div>
    </div>`).join('');

  document.getElementById('modalContainer').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-box">
        <div class="modal-title">Add Exercise</div>
        <input type="text" class="form-input mb-16" placeholder="Search..." oninput="filterEditExPicker(this.value)">
        <div id="editExPickerList" style="max-height:400px;overflow-y:auto;">${html}</div>
      </div>
    </div>`;

  document.getElementById('editExPickerList').addEventListener('click', function(e) {
    const card = e.target.closest('.exercise-edit-pick');
    if (!card) return;
    const idx = parseInt(card.dataset.idx);
    const ex = window._pickerExercises[idx];
    if (ex) {
      window._editData.exercises.push({
        name: ex.name,
        muscles: ex.muscles || [],
        sets: [{ weight: '', reps: '' }]
      });
      closeModal();
      renderEditForm();
    }
  });
}

function filterEditExPicker(query) {
  document.querySelectorAll('#editExPickerList .library-card').forEach(card => {
    const name = card.querySelector('div').textContent.toLowerCase();
    card.style.display = name.includes(query.toLowerCase()) ? '' : 'none';
  });
}

// ===== Save / Cancel =====

async function saveEditWorkout() {
  const data = window._editData;
  if (!data) return;

  const { error } = await db.from('workouts')
    .update({
      name: data.name || 'Workout',
      date: data.date,
      notes: data.notes,
      exercises: data.exercises
    })
    .eq('id', data.id);

  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  editingWorkoutId = null;
  window._editData = null;
  showToast('Workout updated!');
  loadHistory();  // Reload the full list
}

function cancelEditWorkout() {
  editingWorkoutId = null;
  window._editData = null;
  loadHistory();  // Re-render to go back to view mode
}

// ===== Delete =====

async function deleteWorkout(id) {
  if (!confirm('Delete this workout?')) return;
  await db.from('workouts').delete().eq('id', id);
  showToast('Deleted');
  loadHistory();
}
