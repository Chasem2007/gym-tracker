/*
  =============================================
  programs.js — PROGRAM BUILDER (PRO)
  =============================================
  SQL to run in Supabase:

  CREATE TABLE programs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(user_id) on delete cascade,
    name text not null,
    weeks int not null,
    days_per_week int not null,
    structure jsonb not null,
    created_at timestamptz default now()
  );
  -- structure: { days: [{ name, exercises: [{ name, muscles, sets, reps, progression }] }] }
  =============================================
*/

/*
  Weekly schedule SQL:
  CREATE TABLE weekly_schedule (
    id uuid primary key default gen_random_uuid(),
    user_id text references users(user_id) on delete cascade,
    day_of_week int not null, -- 0=Monday ... 6=Sunday
    label text,
    updated_at timestamptz default now(),
    unique(user_id, day_of_week)
  );
*/

let _programDraft = null;
let _programsTab = 'schedule'; // 'schedule' | 'programs'

async function loadPrograms() {
  if (!isPro()) {
    showUpgradePrompt('programs-content', 'Programs & Schedules');
    return;
  }
  renderProgramsTabBar();
  if (_programsTab === 'schedule') await renderWeeklySchedule();
  else await renderProgramsList();
}

function renderProgramsTabBar() {
  const container = document.getElementById('programs-content');
  // Inject tab bar at top (preserve rest)
  let tabBar = document.getElementById('programs-tab-bar');
  if (!tabBar) {
    tabBar = document.createElement('div');
    tabBar.id = 'programs-tab-bar';
    container.prepend(tabBar);
  }
  tabBar.innerHTML = `
    <div class="tabs" style="margin-bottom:20px;">
      <button class="tab-btn${_programsTab === 'schedule' ? ' active' : ''}"
        onclick="switchProgramsTab('schedule')">📅 Weekly Schedule</button>
      <button class="tab-btn${_programsTab === 'programs' ? ' active' : ''}"
        onclick="switchProgramsTab('programs')">📋 Programs</button>
    </div>`;
}

async function switchProgramsTab(tab) {
  _programsTab = tab;
  const container = document.getElementById('programs-content');
  container.innerHTML = '';
  renderProgramsTabBar();
  if (tab === 'schedule') await renderWeeklySchedule();
  else await renderProgramsList();
}

// ===== WEEKLY SCHEDULE =====

const DAYS_OF_WEEK = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

async function renderWeeklySchedule() {
  const container = document.getElementById('programs-content');
  const tabBar = document.getElementById('programs-tab-bar');

  // Load existing schedule
  let schedule = {};
  try {
    const { data } = await db.from('weekly_schedule')
      .select('*').eq('user_id', currentUser.user_id);
    (data || []).forEach(row => { schedule[row.day_of_week] = row.label || ''; });
  } catch (e) { /* table may not exist yet */ }

  const scheduleHtml = `
    <div id="weekly-schedule-body">
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">
        Set what you typically train each day. This is your default weekly split — tap any day to edit it.
      </p>
      <div class="weekly-schedule-grid">
        ${DAYS_OF_WEEK.map((day, i) => {
          const label = schedule[i] || '';
          const isToday = new Date().getDay() === (i === 6 ? 0 : i + 1); // Mon=0 in our mapping
          return `
            <div class="schedule-day-card${isToday ? ' schedule-day-card--today' : ''}${label ? ' schedule-day-card--set' : ''}">
              <div class="schedule-day-name">${day}${isToday ? ' <span style="font-size:10px;color:var(--accent);">TODAY</span>' : ''}</div>
              <input type="text" class="form-input schedule-day-input" placeholder="e.g. Chest & Tri, Rest"
                value="${label}" data-day="${i}"
                onchange="saveScheduleDay(${i}, this.value)"
                oninput="this.closest('.schedule-day-card').classList.toggle('schedule-day-card--set', this.value.trim().length > 0)">
            </div>`;
        }).join('')}
      </div>
      <p style="font-size:12px;color:var(--text-muted);margin-top:16px;">Changes save automatically.</p>
    </div>`;

  // Append after tab bar
  let body = document.getElementById('weekly-schedule-body');
  if (body) { body.outerHTML = scheduleHtml; }
  else { container.insertAdjacentHTML('beforeend', scheduleHtml); }
}

async function saveScheduleDay(dayOfWeek, label) {
  try {
    await db.from('weekly_schedule').upsert(
      { user_id: currentUser.user_id, day_of_week: dayOfWeek, label: label.trim() },
      { onConflict: 'user_id,day_of_week' }
    );
  } catch (e) { /* ignore if table doesn't exist */ }
}

// ===== PROGRAMS LIST =====

async function renderProgramsList() {
  const container = document.getElementById('programs-content');
  showLoading(container);

  const { data: programs } = await db.from('programs')
    .select('*')
    .eq('user_id', currentUser.user_id)
    .order('created_at', { ascending: false });

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <h3 class="font-display" style="font-size:18px;letter-spacing:1px;">MY PROGRAMS</h3>
        <p style="font-size:13px;color:var(--text-muted);">Build structured training plans</p>
      </div>
      <button class="btn btn-primary" onclick="showProgramBuilder()">+ New Program</button>
    </div>
    ${programs && programs.length
      ? `<div class="programs-grid">${programs.map(p => programCard(p)).join('')}</div>`
      : `<div class="empty-state">
          <div style="font-size:48px;margin-bottom:12px;">📋</div>
          <p>No programs yet. Build your first training plan!</p>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="showProgramBuilder()">Create Program</button>
        </div>`}`;
}

function programCard(p) {
  const created = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `
    <div class="program-card">
      <div class="program-card-header">
        <div class="program-card-name">${p.name}</div>
        <div class="program-card-meta">${p.weeks} weeks · ${p.days_per_week} days/week</div>
      </div>
      <div class="program-card-date">Created ${created}</div>
      <div class="program-card-actions">
        <button class="btn btn-primary btn-sm" onclick="showActiveProgram('${p.id}')">▶ Start</button>
        <button class="btn btn-ghost btn-sm" onclick="editProgram('${p.id}')">✏ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProgram('${p.id}')">🗑</button>
      </div>
    </div>`;
}

async function deleteProgram(id) {
  if (!confirm('Delete this program? This cannot be undone.')) return;
  await db.from('programs').delete().eq('id', id);
  showToast('Program deleted');
  renderProgramsList();
}

// ===== PROGRAM BUILDER =====

function showProgramBuilder(existingProgram) {
  _programDraft = existingProgram
    ? { id: existingProgram.id, name: existingProgram.name, weeks: existingProgram.weeks, daysPerWeek: existingProgram.days_per_week, days: existingProgram.structure.days, step: 2 }
    : { name: '', weeks: 8, daysPerWeek: 4, days: [], step: 1 };
  renderBuilderStep1();
}

async function editProgram(id) {
  const { data } = await db.from('programs').select('*').eq('id', id).single();
  if (data) showProgramBuilder(data);
}

function renderBuilderStep1() {
  const container = document.getElementById('programs-content');
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
      <button class="btn btn-ghost btn-sm" onclick="renderProgramsList()">← Back</button>
      <h3 class="font-display" style="font-size:18px;letter-spacing:1px;">${_programDraft.id ? 'EDIT PROGRAM' : 'NEW PROGRAM'}</h3>
    </div>
    <div class="card">
      <div class="card-title mb-16">Step 1 — Program Basics</div>
      <div class="form-group">
        <label>Program Name</label>
        <input type="text" id="progName" class="form-input" placeholder="e.g. 5/3/1, PPL, Upper-Lower" value="${_programDraft.name}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Duration (weeks)</label>
          <select id="progWeeks" class="form-input">
            ${[4,6,8,10,12,16].map(w => `<option value="${w}" ${_programDraft.weeks == w ? 'selected' : ''}>${w} weeks</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Days per Week</label>
          <select id="progDays" class="form-input">
            ${[2,3,4,5,6].map(d => `<option value="${d}" ${_programDraft.daysPerWeek == d ? 'selected' : ''}>${d} days</option>`).join('')}
          </select>
        </div>
      </div>
      <button class="btn btn-primary w-full mt-16" onclick="builderStep1Next()" style="justify-content:center;">
        Build Schedule →
      </button>
    </div>`;
}

function builderStep1Next() {
  const name = document.getElementById('progName').value.trim();
  if (!name) { showToast('Enter a program name', 'error'); return; }
  _programDraft.name = name;
  _programDraft.weeks = parseInt(document.getElementById('progWeeks').value);
  _programDraft.daysPerWeek = parseInt(document.getElementById('progDays').value);

  // Initialize days if needed
  if (!_programDraft.days.length || _programDraft.days.length !== _programDraft.daysPerWeek) {
    _programDraft.days = Array.from({ length: _programDraft.daysPerWeek }, (_, i) => ({
      name: `Day ${i + 1}`,
      exercises: []
    }));
  }
  _programDraft.step = 2;
  _programDraft.activeDay = 0;
  renderBuilderStep2();
}

function renderBuilderStep2() {
  const container = document.getElementById('programs-content');
  const day = _programDraft.days[_programDraft.activeDay];

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
      <button class="btn btn-ghost btn-sm" onclick="renderBuilderStep1()">← Back</button>
      <h3 class="font-display" style="font-size:18px;letter-spacing:1px;">${_programDraft.name}</h3>
    </div>
    <div class="tabs" style="margin-bottom:16px;flex-wrap:wrap;">
      ${_programDraft.days.map((d, i) => `
        <button class="tab-btn${i === _programDraft.activeDay ? ' active' : ''}"
          onclick="_programDraft.activeDay=${i};renderBuilderStep2()">${d.name}</button>
      `).join('')}
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="form-group">
        <label>Day Name</label>
        <input type="text" class="form-input" placeholder="e.g. Push, Pull, Legs"
          value="${day.name}"
          oninput="_programDraft.days[${_programDraft.activeDay}].name=this.value;
            document.querySelectorAll('.tabs .tab-btn')[${_programDraft.activeDay}].textContent=this.value||'Day ${_programDraft.activeDay+1}'">
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin:16px 0 10px;">
        <span class="card-title">Exercises</span>
        <button class="btn btn-primary btn-sm" onclick="openProgExercisePicker()">+ Add Exercise</button>
      </div>
      <div id="progExerciseList">
        ${day.exercises.length
          ? day.exercises.map((ex, ei) => progExerciseRow(ei, ex)).join('')
          : '<div class="empty-state" style="padding:12px 0;"><p>Add exercises for this day</p></div>'}
      </div>
    </div>
    <button class="btn btn-primary w-full" onclick="saveProgram()" style="justify-content:center;padding:14px;">
      💾 Save Program
    </button>`;
}

function progExerciseRow(ei, ex) {
  const progressions = ['+2.5 lbs/wk', '+5 lbs/wk', '+1 rep/wk', 'None'];
  return `
    <div class="prog-ex-row">
      <div class="prog-ex-name">${ex.name}</div>
      <div class="prog-ex-controls">
        <div class="form-group" style="margin-bottom:0;min-width:60px;">
          <label style="font-size:10px;">Sets</label>
          <input type="number" class="form-input" value="${ex.sets}" min="1" max="20"
            onchange="_programDraft.days[_programDraft.activeDay].exercises[${ei}].sets=parseInt(this.value)||1">
        </div>
        <div class="form-group" style="margin-bottom:0;min-width:80px;">
          <label style="font-size:10px;">Reps</label>
          <input type="text" class="form-input" value="${ex.reps}" placeholder="8-12"
            onchange="_programDraft.days[_programDraft.activeDay].exercises[${ei}].reps=this.value">
        </div>
        <div class="form-group" style="margin-bottom:0;min-width:120px;">
          <label style="font-size:10px;">Progression</label>
          <select class="form-input" onchange="_programDraft.days[_programDraft.activeDay].exercises[${ei}].progression=this.value">
            ${progressions.map(p => `<option value="${p}" ${ex.progression === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;padding:0 4px;align-self:flex-end;"
          onclick="_programDraft.days[_programDraft.activeDay].exercises.splice(${ei},1);renderBuilderStep2()">×</button>
      </div>
    </div>`;
}

async function openProgExercisePicker() {
  const library = await getExerciseLibrary();
  const container = document.getElementById('modalContainer');
  container.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-box">
        <div class="modal-title">Add Exercise to Day</div>
        <input type="text" id="progPickerSearch" class="form-input" style="margin-bottom:12px;" placeholder="Search...">
        <div id="progPickerList" style="max-height:360px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">
          ${library.map((ex, idx) => `
            <div class="library-card exercise-pick-item" style="cursor:pointer;padding:10px;" data-idx="${idx}">
              <div style="font-weight:600;font-size:14px;">${ex.name}</div>
              <div style="font-size:11px;color:var(--text-muted);">${ex.equipment || ''} — ${(ex.muscles || []).join(', ')}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;

  document.getElementById('progPickerSearch').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#progPickerList .exercise-pick-item').forEach(card => {
      card.style.display = card.querySelector('div').textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  document.getElementById('progPickerList').addEventListener('click', function(e) {
    const card = e.target.closest('.exercise-pick-item');
    if (!card) return;
    const ex = library[parseInt(card.dataset.idx)];
    if (ex) {
      _programDraft.days[_programDraft.activeDay].exercises.push({
        name: ex.name, muscles: ex.muscles || [],
        sets: 3, reps: '8-12', progression: '+5 lbs/wk'
      });
      closeModal();
      renderBuilderStep2();
    }
  });
}

async function saveProgram() {
  const name = _programDraft.name;
  if (!name) { showToast('Program name required', 'error'); return; }

  const payload = {
    user_id: currentUser.user_id,
    name,
    weeks: _programDraft.weeks,
    days_per_week: _programDraft.daysPerWeek,
    structure: { days: _programDraft.days }
  };

  let error;
  if (_programDraft.id) {
    ({ error } = await db.from('programs').update(payload).eq('id', _programDraft.id));
  } else {
    ({ error } = await db.from('programs').insert(payload));
  }

  if (error) { showToast('Error saving: ' + error.message, 'error'); return; }
  showToast('Program saved!');
  _programDraft = null;
  renderProgramsList();
}

// ===== ACTIVE PROGRAM VIEW =====

async function showActiveProgram(id) {
  const { data: p } = await db.from('programs').select('*').eq('id', id).single();
  if (!p) return;

  const container = document.getElementById('programs-content');
  let currentWeek = 1;
  let activeDay = 0;

  function calcTarget(ex, week) {
    const prog = ex.progression || 'None';
    const baseReps = ex.reps;
    if (prog === '+5 lbs/wk') return `${(parseInt(ex.sets) || 3) } × ${baseReps} (+${(week-1)*5} lbs from base)`;
    if (prog === '+2.5 lbs/wk') return `${(parseInt(ex.sets) || 3)} × ${baseReps} (+${((week-1)*2.5).toFixed(1)} lbs from base)`;
    if (prog === '+1 rep/wk') return `${(parseInt(ex.sets) || 3)} × Week ${week} target`;
    return `${(parseInt(ex.sets) || 3)} × ${baseReps}`;
  }

  function render() {
    const day = p.structure.days[activeDay];
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <button class="btn btn-ghost btn-sm" onclick="renderProgramsList()">← Programs</button>
        <h3 class="font-display" style="font-size:18px;letter-spacing:1px;">${p.name}</h3>
      </div>
      <div class="card mb-16">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span style="font-size:13px;color:var(--text-muted);">Week:</span>
          <select class="form-input" style="width:auto;" onchange="currentWeek=parseInt(this.value);document.getElementById('active-prog-body').innerHTML=buildDayHtml()">
            ${Array.from({length: p.weeks}, (_,i) => `<option value="${i+1}" ${currentWeek===i+1?'selected':''}>Week ${i+1}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="tabs" style="margin-bottom:16px;flex-wrap:wrap;">
        ${p.structure.days.map((d, i) => `
          <button class="tab-btn${i===activeDay?' active':''}" onclick="activeDay=${i};render()">${d.name}</button>
        `).join('')}
      </div>
      <div id="active-prog-body" class="card">
        ${buildDayHtml()}
      </div>`;

    function buildDayHtml() {
      const d = p.structure.days[activeDay];
      if (!d.exercises.length) return '<div class="empty-state"><p>No exercises for this day</p></div>';
      return `
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
          ${d.exercises.map(ex => `
            <div class="prog-active-ex">
              <div style="font-weight:600;font-size:15px;">${ex.name}</div>
              <div style="font-size:13px;color:var(--text-muted);">${calcTarget(ex, currentWeek)}</div>
            </div>`).join('')}
        </div>
        <button class="btn btn-primary w-full" onclick="loadProgramDay()" style="justify-content:center;padding:14px;">
          Log Today's Workout
        </button>`;
    }

    window.render = render;
    window.loadProgramDay = () => {
      const d = p.structure.days[activeDay];
      d.exercises.forEach(ex => addExerciseToWorkout(ex.name, ex.muscles || []));
      showPage('log');
      showToast('Exercises loaded from program!');
    };
  }

  render();
}
