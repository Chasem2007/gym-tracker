/*
  =============================================
  library.js — EXERCISE LIBRARY
  =============================================
  Browse all exercises, filter by muscle group,
  search by name, and add custom exercises.
  On first load, seeds the default exercises
  into Supabase if the table is empty.
  =============================================
*/

let libraryFilter = 'all';  // Current filter tab

// Fetches exercises from Supabase.
// If the table is empty, inserts the defaults first.
async function getExerciseLibrary() {
  const { data } = await supabase
    .from('exercise_library')
    .select('*')
    .order('name');

  if (!data || !data.length) {
    // Table is empty — seed it with defaults
    await supabase.from('exercise_library').insert(
      DEFAULT_EXERCISES.map(ex => ({
        name: ex.name,
        muscles: ex.muscles,
        category: ex.category,
        equipment: ex.equipment,
        created_by: currentUser.user_id
      }))
    );
    const { data: seeded } = await supabase
      .from('exercise_library')
      .select('*')
      .order('name');
    return seeded || [];
  }
  return data;
}

// Renders the exercise grid, applying search + filter
async function renderLibrary() {
  const exercises = await getExerciseLibrary();
  const search = (document.getElementById('librarySearch').value || '').toLowerCase();
  const grid = document.getElementById('libraryGrid');

  const filtered = exercises.filter(ex => {
    const matchesFilter = libraryFilter === 'all' || ex.category === libraryFilter;
    const matchesSearch = !search || ex.name.toLowerCase().includes(search);
    return matchesFilter && matchesSearch;
  });

  grid.innerHTML = filtered.map(ex => {
    const tags = (ex.muscles || []).map(m =>
      `<span class="muscle-tag tag-${m}">${m}</span>`
    ).join('');
    return `<div class="library-card">
      <div style="font-weight:600;font-size:15px;margin-bottom:6px;">${ex.name}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">${ex.equipment || '—'}</div>
      <div>${tags}</div>
    </div>`;
  }).join('');

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><p>No exercises found.</p></div>';
  }
}

// Changes the active muscle group tab
function setLibraryFilter(filter, btn) {
  libraryFilter = filter;
  document.querySelectorAll('#libraryTabs .tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderLibrary();
}

// Opens a modal to create a brand new exercise
function openAddExerciseModal() {
  document.getElementById('modalContainer').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-box">
        <div class="modal-title">Add New Exercise</div>
        <div class="form-group">
          <label>Exercise Name</label>
          <input type="text" id="newExName" class="form-input" placeholder="e.g. Incline Bench Press">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Category</label>
            <select id="newExCategory" class="form-input">
              <option value="chest">Chest</option>
              <option value="back">Back</option>
              <option value="legs">Legs</option>
              <option value="shoulders">Shoulders</option>
              <option value="arms">Arms</option>
              <option value="core">Core</option>
              <option value="cardio">Cardio</option>
            </select>
          </div>
          <div class="form-group">
            <label>Equipment</label>
            <input type="text" id="newExEquipment" class="form-input" placeholder="e.g. Barbell">
          </div>
        </div>
        <div class="form-group">
          <label>Muscles Worked (comma separated)</label>
          <input type="text" id="newExMuscles" class="form-input" placeholder="e.g. chest, shoulders, arms">
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
          <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveNewExercise()">Save Exercise</button>
        </div>
      </div>
    </div>`;
}

// Saves the new exercise to Supabase
async function saveNewExercise() {
  const name = document.getElementById('newExName').value.trim();
  const category = document.getElementById('newExCategory').value;
  const equipment = document.getElementById('newExEquipment').value.trim();
  const muscles = document.getElementById('newExMuscles').value
    .split(',')
    .map(m => m.trim().toLowerCase())
    .filter(Boolean);

  if (!name) { showToast('Enter an exercise name', 'error'); return; }

  await supabase.from('exercise_library').insert({
    name, category, equipment, muscles,
    created_by: currentUser.user_id
  });

  closeModal();
  showToast('Exercise added to library!');
  renderLibrary();
}
