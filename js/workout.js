/*
  =============================================
  workout.js — LOG WORKOUT (with auto-save)
  =============================================
  
  HOW AUTO-SAVE WORKS:
  Every time you change anything — add an exercise,
  type a weight, add a set, change the session name —
  the entire workout-in-progress gets saved to
  localStorage (your browser's built-in storage).
  
  When you navigate back to the Log Workout page,
  it checks localStorage and restores everything
  exactly where you left off.
  
  The draft clears ONLY when you:
  1. Hit "Save Workout" (saves to Supabase, clears draft)
  2. Hit "Discard Workout" (clears draft without saving)
  =============================================
*/

// Active countdown timer reference (only one timer at a time)
let activeTimer = null;

// The key used to store the draft in localStorage.
// Each user gets their own draft so multiple users
// on the same device don't overwrite each other.
function getDraftKey() {
  return 'ironlog_draft_' + (currentUser ? currentUser.user_id : 'anon');
}

// Holds the exercises being built for the current workout
let currentExercises = [];

// Saves the current workout state to localStorage
function saveDraft() {
  const draft = {
    date: document.getElementById('workoutDate').value,
    name: document.getElementById('workoutName').value,
    notes: document.getElementById('workoutNotes').value,
    exercises: currentExercises
  };
  localStorage.setItem(getDraftKey(), JSON.stringify(draft));
}

// Loads any saved draft when you visit the Log Workout page
function loadDraft() {
  const saved = localStorage.getItem(getDraftKey());
  if (!saved) return;

  try {
    const draft = JSON.parse(saved);
    if (draft.date) document.getElementById('workoutDate').value = draft.date;
    if (draft.name) document.getElementById('workoutName').value = draft.name;
    if (draft.notes) document.getElementById('workoutNotes').value = draft.notes;
    if (draft.exercises && draft.exercises.length) {
      currentExercises = draft.exercises;
      renderExerciseList();
      showToast('Workout draft restored', 'success');
    }
  } catch (e) {
    // If the draft is corrupted, just clear it
    localStorage.removeItem(getDraftKey());
  }
}

// Clears the draft from localStorage
function clearDraft() {
  localStorage.removeItem(getDraftKey());
}

// Opens a modal showing all exercises to pick from
async function openExercisePicker() {
  const exercises = await getExerciseLibrary();
  window._pickerExercises = exercises;
  window._pickerMuscleFilter = 'all';

  document.getElementById('modalContainer').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-box">
        <div class="modal-title">Select Exercise</div>
        <input type="text" id="exPickerSearch" class="form-input" style="margin-bottom:12px;" placeholder="Search exercises...">
        <div class="tabs" id="exPickerTabs" style="margin-bottom:12px;flex-wrap:wrap;gap:4px;">
          <button class="tab-btn active" onclick="setExPickerFilter('all',this)">All</button>
          <button class="tab-btn" onclick="setExPickerFilter('chest',this)">Chest</button>
          <button class="tab-btn" onclick="setExPickerFilter('back',this)">Back</button>
          <button class="tab-btn" onclick="setExPickerFilter('legs',this)">Legs</button>
          <button class="tab-btn" onclick="setExPickerFilter('shoulders',this)">Shoulders</button>
          <button class="tab-btn" onclick="setExPickerFilter('arms',this)">Arms</button>
          <button class="tab-btn" onclick="setExPickerFilter('core',this)">Core</button>
          <button class="tab-btn" onclick="setExPickerFilter('cardio',this)">Cardio</button>
        </div>
        <div id="exPickerList" style="max-height:360px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
          ${exercises.map((ex, idx) => `
            <div class="library-card exercise-pick-item" style="cursor:pointer;padding:12px;" data-idx="${idx}" data-category="${ex.category || ''}">
              <div style="font-weight:600;font-size:14px;">${ex.name}</div>
              <div style="font-size:11px;color:var(--text-muted);">${ex.equipment || ''} — ${(ex.muscles || []).join(', ')}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;

  document.getElementById('exPickerSearch').addEventListener('input', filterExPicker);

  document.getElementById('exPickerList').addEventListener('click', function(e) {
    const card = e.target.closest('.exercise-pick-item');
    if (!card) return;
    const idx = parseInt(card.dataset.idx);
    const ex = window._pickerExercises[idx];
    if (ex) addExerciseToWorkout(ex.name, ex.muscles || []);
  });
}

function setExPickerFilter(filter, btn) {
  window._pickerMuscleFilter = filter;
  document.querySelectorAll('#exPickerTabs .tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterExPicker();
}

function filterExPicker() {
  const query = (document.getElementById('exPickerSearch')?.value || '').toLowerCase();
  const filter = window._pickerMuscleFilter || 'all';
  document.querySelectorAll('#exPickerList .exercise-pick-item').forEach(card => {
    const name = card.querySelector('div').textContent.toLowerCase();
    const category = card.dataset.category || '';
    const matchesSearch = !query || name.includes(query);
    const matchesFilter = filter === 'all' || category === filter;
    card.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
  });
}

// Adds a selected exercise to the current workout
function addExerciseToWorkout(name, muscles) {
  closeModal();
  currentExercises.push({
    id: Date.now(),
    name,
    muscles: muscles || [],
    sets: [{ weight: '', reps: '', type: 'WK' }]
  });
  renderExerciseList();
  saveDraft();  // Auto-save!
  const exIdx = currentExercises.length - 1;
  renderOverloadHint(exIdx, name);
}

// Set type labels and their display styles
const SET_TYPES = [
  { value: 'WK', label: 'WK',  title: 'Working set' },
  { value: 'W',  label: 'W',   title: 'Warm-up' },
  { value: 'D',  label: 'D',   title: 'Deload' },
  { value: 'MR', label: 'MR',  title: 'Myo-rep' },
  { value: 'DS', label: 'DS',  title: 'Drop set' },
];

// Draws all exercise entries with their set rows
function renderExerciseList() {
  const container = document.getElementById('exerciseList');

  if (!currentExercises.length) {
    container.innerHTML = '<div class="empty-state"><p>Add exercises to start building your workout</p></div>';
    const discardBtn = document.getElementById('discardWorkoutBtn');
    if (discardBtn) discardBtn.style.display = 'none';
    const bottomAdd = document.getElementById('bottomAddExercise');
    if (bottomAdd) bottomAdd.style.display = 'none';
    if (typeof renderRecommendations === 'function') renderRecommendations();
    return;
  }

  const discardBtn = document.getElementById('discardWorkoutBtn');
  if (discardBtn) discardBtn.style.display = 'inline-flex';
  const bottomAdd = document.getElementById('bottomAddExercise');
  if (bottomAdd) bottomAdd.style.display = 'block';

  container.innerHTML = currentExercises.map((ex, exIdx) => {
    const setsHtml = ex.sets.map((s, setIdx) => {
      const type = s.type || 'WK';
      const isWarmup = type === 'W';
      const isTimed = s.timed === true;

      const typeOptions = SET_TYPES.map(t =>
        `<option value="${t.value}" title="${t.title}" ${type === t.value ? 'selected' : ''}>${t.label}</option>`
      ).join('');

      const repsOrDuration = isTimed
        ? `<input class="set-input" type="number" placeholder="sec" value="${s.duration || ''}"
               onchange="updateSet(${exIdx},${setIdx},'duration',this.value)" min="1">`
        : `<input class="set-input" type="number" placeholder="reps" value="${s.reps || ''}"
               onchange="updateSet(${exIdx},${setIdx},'reps',this.value)">`;

      const timerBtn = isTimed
        ? `<button class="set-timer-btn active" title="Switch to reps" onclick="toggleTimedSet(${exIdx},${setIdx})">⏱</button>
           <button class="set-start-btn" onclick="startTimer(${s.duration || 30},'${ex.name} set ${setIdx + 1}')">▶</button>`
        : `<button class="set-timer-btn" title="Switch to timed" onclick="toggleTimedSet(${exIdx},${setIdx})">⏱</button>`;

      return `
      <div class="set-row${isWarmup ? ' set-row-warmup' : ''}">
        <select class="set-type-select" onchange="updateSet(${exIdx},${setIdx},'type',this.value)" title="Set type">
          ${typeOptions}
        </select>
        <div class="set-num">${setIdx + 1}</div>
        <input class="set-input" type="number" placeholder="lbs" value="${s.weight || ''}"
               onchange="updateSet(${exIdx},${setIdx},'weight',this.value)">
        ${repsOrDuration}
        ${timerBtn}
        <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px;padding:0 2px;"
                onclick="removeSet(${exIdx},${setIdx})">×</button>
      </div>`;
    }).join('');

    return `<div class="exercise-entry">
      <div class="exercise-entry-header">
        <span class="exercise-name">${ex.name}</span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="addSet(${exIdx})">+ Set</button>
          <button class="btn btn-danger btn-sm" onclick="removeExercise(${exIdx})">Remove</button>
        </div>
      </div>
      <div class="set-row-header">
        <div>TYPE</div><div>SET</div><div>WEIGHT</div><div>REPS</div><div></div><div></div>
      </div>
      ${setsHtml}
    </div>`;
  }).join('');

  if (typeof renderRecommendations === 'function') renderRecommendations();
}

// Toggles timed mode for a set
function toggleTimedSet(exIdx, setIdx) {
  const s = currentExercises[exIdx].sets[setIdx];
  s.timed = !s.timed;
  if (s.timed) { s.duration = s.duration || 30; delete s.reps; }
  else { s.reps = ''; delete s.timed; delete s.duration; }
  renderExerciseList();
  saveDraft();
}

// Starts a countdown timer overlay
function startTimer(duration, label) {
  if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }

  let overlay = document.getElementById('timerOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'timerOverlay';
    document.body.appendChild(overlay);
  }

  let remaining = parseInt(duration) || 30;

  function updateDisplay() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    overlay.innerHTML = `
      <div id="timerInner">
        <div id="timerLabel">${label || 'Timed Set'}</div>
        <div id="timerCount">${m > 0 ? m + ':' + String(s).padStart(2,'0') : s}</div>
        <div id="timerSub">seconds remaining</div>
        <button id="timerCancelBtn" onclick="cancelTimer()">Cancel</button>
      </div>`;
  }

  overlay.className = 'timer-overlay';
  updateDisplay();

  activeTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(activeTimer);
      activeTimer = null;
      overlay.className = 'timer-overlay timer-done';
      overlay.innerHTML = `
        <div id="timerInner">
          <div id="timerCount">✓</div>
          <div id="timerSub">Done!</div>
        </div>`;
      setTimeout(() => { overlay.remove(); }, 2500);
      return;
    }
    updateDisplay();
  }, 1000);
}

// Cancels the active timer
function cancelTimer() {
  if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }
  const overlay = document.getElementById('timerOverlay');
  if (overlay) overlay.remove();
}

// Updates a single set's weight or reps value
function updateSet(exIdx, setIdx, field, value) {
  currentExercises[exIdx].sets[setIdx][field] = value;
  saveDraft();  // Auto-save on every change!
}

// Adds a new empty set row to an exercise
function addSet(exIdx) {
  currentExercises[exIdx].sets.push({ weight: '', reps: '', type: 'WK' });
  renderExerciseList();
  saveDraft();
}

// Removes a set row. If it was the last set, removes the whole exercise.
function removeSet(exIdx, setIdx) {
  currentExercises[exIdx].sets.splice(setIdx, 1);
  if (!currentExercises[exIdx].sets.length) currentExercises.splice(exIdx, 1);
  renderExerciseList();
  saveDraft();
}

// Removes an entire exercise from the workout
function removeExercise(exIdx) {
  currentExercises.splice(exIdx, 1);
  renderExerciseList();
  saveDraft();
}

// Discards the in-progress workout
function discardWorkout() {
  if (!confirm('Discard this workout? All unsaved progress will be lost.')) return;
  currentExercises = [];
  clearDraft();
  renderExerciseList();
  document.getElementById('workoutName').value = '';
  document.getElementById('workoutNotes').value = '';
  showToast('Workout discarded');
}

// Saves the entire workout to Supabase and clears the draft
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
    exercises: currentExercises
  });

  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  showToast('Workout saved! 💪');
  currentExercises = [];
  clearDraft();  // Clear the draft since it's now saved to Supabase
  renderExerciseList();
  document.getElementById('workoutName').value = '';
  document.getElementById('workoutNotes').value = '';
}
