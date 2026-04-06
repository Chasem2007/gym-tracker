/*
  =============================================
  habits.js — HABIT TRACKER (PRO)
  =============================================
  SQL to run in Supabase:

  CREATE TABLE habits (
    id uuid primary key default gen_random_uuid(),
    user_id text references users(user_id) on delete cascade,
    name text not null,
    target_count int not null default 1,
    color text default '#ff3a3a',
    active boolean default true,
    created_at timestamptz default now()
  );
  CREATE TABLE habit_logs (
    id uuid primary key default gen_random_uuid(),
    habit_id uuid references habits(id) on delete cascade,
    user_id text references users(user_id) on delete cascade,
    date date not null,
    logged_at timestamptz default now()
  );
  =============================================
*/

const HABIT_COLORS = [
  '#ff3a3a', '#ff6b35', '#ffd740', '#00e676',
  '#4a9eff', '#a78bfa', '#fb923c', '#f472b6'
];

const HABIT_FREQUENCIES = [
  { label: 'Once a day',    value: 1 },
  { label: 'Twice a day',   value: 2 },
  { label: '3× a day',      value: 3 },
  { label: '4× a day',      value: 4 },
];

async function loadHabits() {
  if (!isPro()) {
    showUpgradePrompt('habits-content', 'Habit Tracker');
    return;
  }
  await renderHabitsPage();
}

async function renderHabitsPage() {
  const container = document.getElementById('habits-content');
  showLoading(container);

  const today = new Date().toISOString().split('T')[0];

  const [{ data: habits }, { data: logs }] = await Promise.all([
    db.from('habits').select('*').eq('user_id', currentUser.user_id).eq('active', true).order('created_at'),
    db.from('habit_logs').select('*').eq('user_id', currentUser.user_id).gte('date', getWeekStart())
  ]);

  const allHabits = habits || [];
  const allLogs = logs || [];

  // Count completions per habit for today
  const todayLogs = allLogs.filter(l => l.date === today);
  const countToday = {}; // { habit_id: count }
  todayLogs.forEach(l => {
    countToday[l.habit_id] = (countToday[l.habit_id] || 0) + 1;
  });

  // Streak calculation (consecutive days with at least target_count logs)
  const streaks = {};
  allHabits.forEach(h => {
    streaks[h.id] = calcStreak(h, allLogs);
  });

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <div style="font-size:13px;color:var(--text-muted);">Today — ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
      </div>
      <button class="btn btn-primary" onclick="openAddHabitModal()">+ New Habit</button>
    </div>

    ${allHabits.length === 0
      ? `<div class="empty-state">
          <div style="font-size:48px;margin-bottom:12px;">✅</div>
          <p>No habits yet. Create your first habit to get started!</p>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="openAddHabitModal()">+ New Habit</button>
        </div>`
      : `<div class="habits-list">
          ${allHabits.map(h => habitCard(h, countToday[h.id] || 0, streaks[h.id] || 0)).join('')}
        </div>`}

    ${allHabits.length > 0 ? `
    <div class="card mt-16">
      <div class="card-title mb-16">This Week</div>
      ${renderWeekView(allHabits, allLogs)}
    </div>` : ''}`;
}

function habitCard(habit, countToday, streak) {
  const done = countToday >= habit.target_count;
  const remaining = Math.max(habit.target_count - countToday, 0);
  const pct = Math.min((countToday / habit.target_count) * 100, 100);
  const freq = HABIT_FREQUENCIES.find(f => f.value === habit.target_count)?.label || `${habit.target_count}× a day`;

  return `
    <div class="habit-card${done ? ' habit-card--done' : ''}">
      <div class="habit-card-accent" style="background:${habit.color};"></div>
      <div class="habit-card-body">
        <div class="habit-card-header">
          <div>
            <div class="habit-name">${habit.name}</div>
            <div class="habit-freq">${freq}${streak > 0 ? ` · 🔥 ${streak} day streak` : ''}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="btn btn-ghost btn-sm" onclick="openEditHabitModal('${habit.id}')" title="Edit">✏</button>
            <button class="btn btn-danger btn-sm" onclick="archiveHabit('${habit.id}')" title="Delete">🗑</button>
          </div>
        </div>
        <div class="habit-progress-track">
          <div class="habit-progress-fill" style="width:${pct}%;background:${habit.color};"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
          <span style="font-size:12px;color:var(--text-muted);">
            ${done ? '✅ Complete!' : `${countToday}/${habit.target_count} — ${remaining} more`}
          </span>
          ${!done
            ? `<button class="btn btn-primary btn-sm" onclick="logHabit('${habit.id}')"
                style="background:${habit.color};border-color:${habit.color};">Mark Done</button>`
            : `<button class="btn btn-ghost btn-sm" onclick="logHabit('${habit.id}')">+1 More</button>`}
        </div>
      </div>
    </div>`;
}

function renderWeekView(habits, logs) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: i === 0
    });
  }

  // Count completions per habit per day
  const logMap = {}; // { habit_id_date: count }
  logs.forEach(l => {
    const key = l.habit_id + '_' + l.date;
    logMap[key] = (logMap[key] || 0) + 1;
  });

  return `
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;min-width:400px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:6px 8px;font-size:12px;color:var(--text-muted);font-weight:500;">Habit</th>
            ${days.map(d => `<th style="text-align:center;padding:6px 4px;font-size:11px;color:${d.isToday ? 'var(--accent)' : 'var(--text-muted)'};font-weight:${d.isToday ? '700' : '400'};">${d.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${habits.map(h => `
            <tr>
              <td style="padding:6px 8px;font-size:13px;white-space:nowrap;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${h.color};margin-right:8px;"></span>
                ${h.name}
              </td>
              ${days.map(d => {
                const count = logMap[h.id + '_' + d.date] || 0;
                const met = count >= h.target_count;
                const partial = count > 0 && !met;
                return `<td style="text-align:center;padding:4px;">
                  <div style="width:28px;height:28px;border-radius:6px;margin:0 auto;background:${met ? h.color : partial ? h.color + '55' : 'var(--bg-input)'};border:1px solid ${met || partial ? h.color : 'var(--border)'};display:flex;align-items:center;justify-content:center;font-size:11px;color:${met ? '#fff' : 'var(--text-muted)'};">
                    ${met ? '✓' : count > 0 ? count : ''}
                  </div>
                </td>`;
              }).join('')}
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function getWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().split('T')[0];
}

function calcStreak(habit, logs) {
  const logsByDate = {};
  logs.filter(l => l.habit_id === habit.id).forEach(l => {
    logsByDate[l.date] = (logsByDate[l.date] || 0) + 1;
  });

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if ((logsByDate[dateStr] || 0) >= habit.target_count) {
      streak++;
    } else if (i > 0) {
      break; // missed a day — streak ends
    }
  }
  return streak;
}

async function logHabit(habitId) {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await db.from('habit_logs').insert({
    habit_id: habitId,
    user_id: currentUser.user_id,
    date: today
  });
  if (error) { showToast('Error logging habit', 'error'); return; }
  showToast('Logged! 🎉');
  renderHabitsPage();
}

async function archiveHabit(habitId) {
  if (!confirm('Delete this habit?')) return;
  await db.from('habits').update({ active: false }).eq('id', habitId);
  showToast('Habit removed');
  renderHabitsPage();
}

function openAddHabitModal() {
  document.getElementById('modalContainer').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-box">
        <div class="modal-title">New Habit</div>
        <div class="form-group">
          <label>Habit Name</label>
          <input type="text" id="habitName" class="form-input" placeholder="e.g. Take Creatine, Meditate, Stretch">
        </div>
        <div class="form-group">
          <label>Daily Goal</label>
          <select id="habitTarget" class="form-input">
            ${HABIT_FREQUENCIES.map(f => `<option value="${f.value}">${f.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Color</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
            ${HABIT_COLORS.map((c, i) => `
              <div onclick="document.querySelectorAll('.habit-color-swatch').forEach(s=>s.classList.remove('selected'));this.classList.add('selected');document.getElementById('habitColor').value='${c}'"
                class="habit-color-swatch${i === 0 ? ' selected' : ''}"
                style="background:${c};width:28px;height:28px;border-radius:50%;cursor:pointer;border:3px solid transparent;"></div>`).join('')}
            <input type="hidden" id="habitColor" value="${HABIT_COLORS[0]}">
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;">
          <button class="btn btn-ghost" onclick="closeModal()" style="flex:1;justify-content:center;">Cancel</button>
          <button class="btn btn-primary" onclick="saveNewHabit()" style="flex:1;justify-content:center;">Create Habit</button>
        </div>
      </div>
    </div>`;
}

async function saveNewHabit() {
  const name = document.getElementById('habitName').value.trim();
  if (!name) { showToast('Enter a habit name', 'error'); return; }
  const target_count = parseInt(document.getElementById('habitTarget').value) || 1;
  const color = document.getElementById('habitColor').value;

  const { error } = await db.from('habits').insert({
    user_id: currentUser.user_id, name, target_count, color, active: true
  });
  if (error) { showToast('Error saving habit', 'error'); return; }
  showToast('Habit created!');
  closeModal();
  renderHabitsPage();
}

async function openEditHabitModal(habitId) {
  const { data: habit } = await db.from('habits').select('*').eq('id', habitId).single();
  if (!habit) return;

  document.getElementById('modalContainer').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-box">
        <div class="modal-title">Edit Habit</div>
        <div class="form-group">
          <label>Habit Name</label>
          <input type="text" id="editHabitName" class="form-input" value="${habit.name}">
        </div>
        <div class="form-group">
          <label>Daily Goal</label>
          <select id="editHabitTarget" class="form-input">
            ${HABIT_FREQUENCIES.map(f => `<option value="${f.value}" ${habit.target_count === f.value ? 'selected' : ''}>${f.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Color</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
            ${HABIT_COLORS.map(c => `
              <div onclick="document.querySelectorAll('.habit-color-swatch').forEach(s=>s.classList.remove('selected'));this.classList.add('selected');document.getElementById('editHabitColor').value='${c}'"
                class="habit-color-swatch${habit.color === c ? ' selected' : ''}"
                style="background:${c};width:28px;height:28px;border-radius:50%;cursor:pointer;border:3px solid transparent;"></div>`).join('')}
            <input type="hidden" id="editHabitColor" value="${habit.color}">
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;">
          <button class="btn btn-ghost" onclick="closeModal()" style="flex:1;justify-content:center;">Cancel</button>
          <button class="btn btn-primary" onclick="updateHabit('${habitId}')" style="flex:1;justify-content:center;">Save Changes</button>
        </div>
      </div>
    </div>`;
}

async function updateHabit(habitId) {
  const name = document.getElementById('editHabitName').value.trim();
  if (!name) { showToast('Enter a habit name', 'error'); return; }
  const target_count = parseInt(document.getElementById('editHabitTarget').value) || 1;
  const color = document.getElementById('editHabitColor').value;

  await db.from('habits').update({ name, target_count, color }).eq('id', habitId);
  showToast('Habit updated!');
  closeModal();
  renderHabitsPage();
}
