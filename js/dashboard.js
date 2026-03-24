/*
  =============================================
  dashboard.js — DASHBOARD PAGE
  =============================================
  Pulls data from Supabase and fills in:
  - Stat cards (workouts, volume, weight, calories)
  - Muscle map (body outline that lights up)
  - Recent activity list
  - Weekly volume bar chart
  =============================================
*/

async function loadDashboard() {
  if (!currentUser) return;
  const uid = currentUser.user_id;
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  // --- Fetch this week's workouts ---
  const { data: workouts } = await db
    .from('workouts')
    .select('*')
    .eq('user_id', uid)
    .gte('date', weekStr)      // gte = "greater than or equal"
    .order('date', { ascending: false });

  document.getElementById('statWorkouts').textContent = workouts ? workouts.length : 0;

  // --- Calculate total volume + muscles hit ---
  let totalVol = 0;
  const musclesHit = {};  // e.g. { chest: 3, back: 2, legs: 1 }

  if (workouts) {
    workouts.forEach(w => {
      const exs = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : w.exercises || [];
      exs.forEach(ex => {
        // Count how many times each muscle was hit
        if (ex.muscles) {
          ex.muscles.forEach(m => { musclesHit[m] = (musclesHit[m] || 0) + 1; });
        }
        // Volume = weight × reps for every set
        if (ex.sets) {
          ex.sets.forEach(s => {
            totalVol += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
          });
        }
      });
    });
  }
  document.getElementById('statVolume').textContent = totalVol.toLocaleString();

  // --- Latest body weight ---
  const { data: wd } = await db
    .from('body_weight')
    .select('weight')
    .eq('user_id', uid)
    .order('date', { ascending: false })
    .limit(1);
  document.getElementById('statWeight').textContent = wd && wd.length ? wd[0].weight : '—';

  // --- Today's total calories ---
  const { data: cd } = await db
    .from('calories')
    .select('calories')
    .eq('user_id', uid)
    .eq('date', todayStr);
  const todayCals = cd ? cd.reduce((sum, c) => sum + (c.calories || 0), 0) : 0;
  document.getElementById('statCalories').textContent = todayCals.toLocaleString();

  // --- Greeting ---
  const hr = now.getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dashGreeting').textContent =
    `${greeting}, ${currentUser.display_name || currentUser.username}. Let's get after it.`;

  // --- Render visuals ---
  renderMuscleMap(musclesHit);
  renderRecentActivity(workouts || []);
  renderWeeklyVolume(workouts || []);
}

// Colors the body outline based on which muscles you've worked
function renderMuscleMap(musclesHit) {
  const container = document.getElementById('muscleMap');
  container.innerHTML = MUSCLE_MAP_SVG;

  const groups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
  const maxHits = Math.max(...groups.map(m => musclesHit[m] || 0), 1);

  groups.forEach(m => {
    const hits = musclesHit[m] || 0;
    let className = 'muscle-none';       // grey = not worked
    if (hits >= maxHits * 0.7) className = 'muscle-hit-3';  // bright red = heavy
    else if (hits >= maxHits * 0.4) className = 'muscle-hit-2';  // orange = moderate
    else if (hits > 0) className = 'muscle-hit-1';  // light = touched

    // Find all SVG shapes for this muscle and set their class
    container.querySelectorAll(`[id*="muscle-${m}"]`).forEach(el => {
      el.setAttribute('class', className);
    });
  });

  // Legend below the map
  document.getElementById('muscleLegend').innerHTML = groups.map(m => {
    const hits = musclesHit[m] || 0;
    return `<span style="color:${hits > 0 ? 'var(--accent)' : 'var(--text-muted)'}">${m} (${hits})</span>`;
  }).join('');
}

// Shows the last few workouts as a simple list
function renderRecentActivity(workouts) {
  const container = document.getElementById('dashRecentActivity');
  if (!workouts.length) {
    container.innerHTML = '<div class="empty-state"><p>No workouts this week. Time to train!</p></div>';
    return;
  }
  const colors = ['var(--accent)', 'var(--green)', 'var(--blue)', 'var(--yellow)', 'var(--purple)'];
  container.innerHTML = workouts.slice(0, 6).map((w, i) => {
    const exs = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []);
    const d = new Date(w.date + 'T12:00:00');
    return `<div class="history-item">
      <div class="history-dot" style="background:${colors[i % colors.length]}"></div>
      <div class="history-info">
        <div class="history-title">${w.name || 'Workout'}</div>
        <div class="history-meta">${exs.length} exercise${exs.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="history-date">${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
    </div>`;
  }).join('');
}

// Bar chart showing volume per day of the week
function renderWeeklyVolume(workouts) {
  const container = document.getElementById('weeklyVolumeChart');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const vol = [0, 0, 0, 0, 0, 0, 0];

  workouts.forEach(w => {
    const d = new Date(w.date + 'T12:00:00');
    let dayIdx = d.getDay() - 1;  // getDay() returns 0=Sun, so Mon=0 in our array
    if (dayIdx < 0) dayIdx = 6;   // Sunday wraps to index 6
    const exs = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []);
    exs.forEach(ex => {
      if (ex.sets) {
        ex.sets.forEach(s => {
          vol[dayIdx] += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
        });
      }
    });
  });

  const maxVol = Math.max(...vol, 1);
  container.innerHTML = days.map((day, i) => {
    const pct = (vol[i] / maxVol) * 100;
    return `<div class="chart-bar-row">
      <div class="chart-bar-label">${day}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width:${Math.max(pct, 2)}%;background:${vol[i] > 0 ? 'var(--accent)' : 'var(--border-light)'};">
          ${vol[i] > 0 ? vol[i].toLocaleString() + ' lbs' : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}
