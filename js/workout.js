/*
  =============================================
  workout.js — LOG WORKOUT
  =============================================
  Pick exercises from the library, add sets
  with weight and reps, then save everything
  as one workout entry in Supabase.
  =============================================
*/

// Holds the exercises being built for the current workout.
// Each has: { id, name, muscles, sets: [{weight, reps}] }
let currentExercises = [];

// Opens a modal showing all exercises to pick from
async function openExercisePicker() {
  const exercises = await getExerciseLibrary();
  
  // Store exercises in a temporary global so we can look them up by index
  window._pickerExercises = exercises;
  
  const html = exercises.map((ex, idx) => `
    <div class="library-card exercise-pick-item" style="cursor:pointer;padding:12px;" data-idx="${idx}">
      <div style="font-weight:600;font-size:14px;">${ex.name}</div>
      <div style="font-size:11px;color:var(--text-muted);">${ex.equipment || ''} — ${(ex.muscles || []).join(', ')}</div>
    </div>`).join('');

  document.getElementById('modalContainer').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-box">
        <div class="modal-title">Select Exercise</div>
        <input type="text" class="form-input mb-16" placeholder="Search..." oninput="filterExPicker(this.value)">
        <div id="exPickerList" style="max-height:400px;overflow-y:auto;">${html}</div>
      </div>
    </div>`;
  
  // Use event delegation — one click listener on the list container
  // that catches clicks on any exercise card inside it
  document.getElementById('exPickerList').addEventListener('click', function(e) {
    const card = e.target.closest('.exercise-pick-item');
    if (!card) return;
    const idx = parseInt(card.dataset.idx);
    const ex = window._pickerExercises[idx];
    if (ex) addExerciseToWorkout(ex.name, ex.muscles || []);
  });
}

// Filters the exercise picker modal as you type
function filterExPicker(query) {
  document.querySelectorAll('#exPickerList .library-card').forEach(card => {
    const name = card.querySelector('div').textContent.toLowerCase();
    card.style.display = name.includes(query.toLowerCase()) ? '' : 'none';
  });
}

// Adds a selected exercise to the current workout
function addExerciseToWorkout(name, muscles) {
  closeModal();
  currentExercises.push({
    id: Date.now(),  // simple unique ID
    name,
    muscles: muscles || [],
    sets: [{ weight: '', reps: '' }]  // start with one empty set
  });
  renderExerciseList();
}

// Draws all the exercise entries with their set rows
function renderExerciseList() {
  const container = document.getElementById('exerciseList');
  if (!currentExercises.length) {
    container.innerHTML = '<div class="empty-state"><p>Add exercises to start building your workout</p></div>';
    return;
  }

  container.innerHTML = currentExercises.map((ex, exIdx) => {
    const setsHtml = ex.sets.map((s, setIdx) => `
      <div class="set-row">
        <div class="set-num">${setIdx + 1}</div>
        <input class="set-input" type="number" placeholder="lbs" value="${s.weight}"
               onchange="updateSet(${exIdx},${setIdx},'weight',this.value)">
        <input class="set-input" type="number" placeholder="reps" value="${s.reps}"
               onchange="updateSet(${exIdx},${setIdx},'reps',this.value)">
        <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px;"
                onclick="removeSet(${exIdx},${setIdx})">×</button>
      </div>`).join('');

    return `<div class="exercise-entry">
      <div class="exercise-entry-header">
        <span class="exercise-name">${ex.name}</span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="addSet(${exIdx})">+ Set</button>
          <button class="btn btn-danger btn-sm" onclick="removeExercise(${exIdx})">Remove</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:40px 1fr 1fr 40px;gap:8px;margin-bottom:6px;">
        <div style="font-size:10px;color:var(--text-muted);text-align:center;">SET</div>
        <div style="font-size:10px;color:var(--text-muted);text-align:center;">WEIGHT</div>
        <div style="font-size:10px;color:var(--text-muted);text-align:center;">REPS</div>
        <div></div>
      </div>
      ${setsHtml}
    </div>`;
  }).join('');
}

// Updates a single set's weight or reps value
function updateSet(exIdx, setIdx, field, value) {
  currentExercises[exIdx].sets[setIdx][field] = value;
}

// Adds a new empty set row to an exercise
function addSet(exIdx) {
  currentExercises[exIdx].sets.push({ weight: '', reps: '' });
  renderExerciseList();
}

// Removes a set row. If it was the last set, removes the whole exercise.
function removeSet(exIdx, setIdx) {
  currentExercises[exIdx].sets.splice(setIdx, 1);
  if (!currentExercises[exIdx].sets.length) currentExercises.splice(exIdx, 1);
  renderExerciseList();
}

// Removes an entire exercise from the workout
function removeExercise(exIdx) {
  currentExercises.splice(exIdx, 1);
  renderExerciseList();
}

// Saves the entire workout to Supabase
async function saveWorkout() {
  if (!currentExercises.length) {
    showToast('Add at least one exercise', 'error');
    return;
  }

  const { error } = await db.from('workouts').insert({
    user_id: currentUser.user_id,
    date: document.getElementById('workoutDate').value,
    name: document.getElementById('workoutName').value.trim() || 'Workout',
    notes: document.getElementById('workoutNotes').value.trim(),
    exercises: currentExercises  // stored as JSON in Supabase
  });

  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  showToast('Workout saved!');
  // Reset the form
  currentExercises = [];
  renderExerciseList();
  document.getElementById('workoutName').value = '';
  document.getElementById('workoutNotes').value = '';
}
