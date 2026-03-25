/*
  =============================================
  analytics.js — ANALYTICS PAGE
  =============================================
  PR Board: Shows your best lift for each exercise
  Strength Progress: Line chart of max weight over time
  Workout Heatmap: GitHub-style consistency grid
  Hydration Stats: 30-day water intake chart
  =============================================
*/

async function loadAnalytics() {
  if (!currentUser) return;
  const uid = currentUser.user_id;

  // Load ALL workouts (not just this week)
  const { data: allWorkouts } = await db
    .from('workouts')
    .select('*')
    .eq('user_id', uid)
    .order('date', { ascending: true });

  const workouts = allWorkouts || [];

  renderPRBoard(workouts);
  populateStrengthSelect(workouts);
  renderHeatmap(workouts);
  renderWaterAnalytics();
}

// =============================================
// PR BOARD — Best single set for each exercise.
// PR = "Personal Record" — your all-time best.
// We track the heaviest weight you've lifted
// for at least 1 rep on each exercise.
// =============================================
function renderPRBoard(workouts) {
  const container = document.getElementById('prBoard');
  const prs = {};  // { "Bench Press": { weight: 225, reps: 5, date: "2025-03-20" } }

  workouts.forEach(w => {
    const exs = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []);
    exs.forEach(ex => {
      (ex.sets || []).forEach(s => {
        const weight = parseFloat(s.weight) || 0;
        const reps = parseInt(s.reps) || 0;
        if (weight <= 0 || reps <= 0) return;

        // Calculate estimated 1RM using Epley formula:
        // e1RM = weight × (1 + reps / 30)
        // This estimates what you COULD lift for 1 rep
        const e1rm = weight * (1 + reps / 30);

        if (!prs[ex.name] || e1rm > prs[ex.name].e1rm) {
          prs[ex.name] = { weight, reps, e1rm, date: w.date };
        }
      });
    });
  });

  const entries = Object.entries(prs).sort((a, b) => b[1].e1rm - a[1].e1rm);

  if (!entries.length) {
    container.innerHTML = '<div class="empty-state"><p>Log some workouts to see your PRs</p></div>';
    return;
  }

  // Medal emojis for top 3
  const medals = ['🥇', '🥈', '🥉'];

  container.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">
    ${entries.slice(0, 12).map(([ name, pr ], i) => {
      const medal = i < 3 ? medals[i] : '';
      const dateStr = new Date(pr.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `
        <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:10px;padding:14px;${i < 3 ? 'border-color:var(--accent);' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-weight:600;font-size:14px;">${medal} ${name}</span>
          </div>
          <div style="display:flex;gap:16px;align-items:baseline;">
            <div>
              <span class="font-display" style="font-size:28px;font-weight:700;color:var(--accent);">${pr.weight}</span>
              <span style="font-size:12px;color:var(--text-muted);"> lbs × ${pr.reps}</span>
            </div>
            <div style="font-size:11px;color:var(--text-muted);">
              e1RM: <span style="color:var(--yellow);font-weight:600;">${Math.round(pr.e1rm)}</span> lbs
            </div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Set on ${dateStr}</div>
        </div>`;
    }).join('')}
  </div>`;
}

// =============================================
// STRENGTH PROGRESS — Shows max weight for a
// specific exercise over time as a line chart
// built with CSS (no chart library needed).
// =============================================
function populateStrengthSelect(workouts) {
  const select = document.getElementById('strengthExerciseSelect');
  const exerciseNames = new Set();

  workouts.forEach(w => {
    const exs = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []);
    exs.forEach(ex => exerciseNames.add(ex.name));
  });

  // Keep the first "Select exercise" option, replace the rest
  const currentVal = select.value;
  select.innerHTML = '<option value="">Select exercise</option>' +
    [...exerciseNames].sort().map(name =>
      `<option value="${name}" ${name === currentVal ? 'selected' : ''}>${name}</option>`
    ).join('');

  // Store workouts globally for the chart renderer
  window._analyticsWorkouts = workouts;

  // If something was selected, re-render
  if (currentVal) renderStrengthChart();
}

function renderStrengthChart() {
  const container = document.getElementById('strengthChart');
  const exerciseName = document.getElementById('strengthExerciseSelect').value;
  const workouts = window._analyticsWorkouts || [];

  if (!exerciseName) {
    container.innerHTML = '<div class="empty-state"><p>Select an exercise to view progress</p></div>';
    return;
  }

  // Gather max weight per date for this exercise
  const dataPoints = [];
  workouts.forEach(w => {
    const exs = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []);
    exs.forEach(ex => {
      if (ex.name !== exerciseName) return;
      let maxWeight = 0;
      (ex.sets || []).forEach(s => {
        const wt = parseFloat(s.weight) || 0;
        if (wt > maxWeight) maxWeight = wt;
      });
      if (maxWeight > 0) {
        dataPoints.push({ date: w.date, weight: maxWeight });
      }
    });
  });

  if (!dataPoints.length) {
    container.innerHTML = '<div class="empty-state"><p>No data for this exercise yet</p></div>';
    return;
  }

  // Sort by date
  dataPoints.sort((a, b) => a.date.localeCompare(b.date));

  const minW = Math.min(...dataPoints.map(d => d.weight));
  const maxW = Math.max(...dataPoints.map(d => d.weight));
  const range = maxW - minW || 1;

  // Build a simple SVG line chart
  const width = 700;
  const height = 200;
  const padX = 40;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = dataPoints.map((d, i) => {
    const x = padX + (i / Math.max(dataPoints.length - 1, 1)) * chartW;
    const y = padY + chartH - ((d.weight - minW) / range) * chartH;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  // Area fill under the line
  const areaD = pathD + ` L ${points[points.length-1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;overflow:visible;">
      <!-- Grid lines -->
      ${[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = padY + chartH - pct * chartH;
        const val = Math.round(minW + pct * range);
        return `<line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="var(--border)" stroke-width="0.5"/>
                <text x="${padX - 6}" y="${y + 4}" text-anchor="end" fill="var(--text-muted)" font-size="10">${val}</text>`;
      }).join('')}
      <!-- Area fill -->
      <path d="${areaD}" fill="var(--accent-dim)" opacity="0.3"/>
      <!-- Line -->
      <path d="${pathD}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Dots -->
      ${points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--accent)" stroke="var(--bg-card)" stroke-width="2"/>
        <title>${p.date}: ${p.weight} lbs</title>
      `).join('')}
      <!-- Date labels (first and last) -->
      <text x="${points[0].x}" y="${height - 2}" text-anchor="middle" fill="var(--text-muted)" font-size="10">${new Date(points[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text>
      <text x="${points[points.length-1].x}" y="${height - 2}" text-anchor="middle" fill="var(--text-muted)" font-size="10">${new Date(points[points.length-1].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text>
    </svg>
    <div style="text-align:center;margin-top:8px;">
      <span style="font-size:12px;color:var(--text-muted);">Best: </span>
      <span class="font-display" style="font-size:18px;font-weight:700;color:var(--accent);">${maxW} lbs</span>
      <span style="font-size:12px;color:var(--text-muted);"> — ${dataPoints.length} session${dataPoints.length !== 1 ? 's' : ''} tracked</span>
    </div>`;
}

// =============================================
// WORKOUT HEATMAP — GitHub-style grid showing
// workout days over the last 6 months.
// Each square = 1 day. Color intensity = volume.
// =============================================
function renderHeatmap(workouts) {
  const container = document.getElementById('workoutHeatmap');

  // Build a map of date → total volume
  const volumeByDate = {};
  workouts.forEach(w => {
    let vol = 0;
    const exs = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []);
    exs.forEach(ex => {
      (ex.sets || []).forEach(s => {
        vol += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
      });
    });
    volumeByDate[w.date] = (volumeByDate[w.date] || 0) + vol;
  });

  // Generate last ~26 weeks (6 months) of dates
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 182); // ~26 weeks
  // Align to start of week (Monday)
  while (startDate.getDay() !== 1) {
    startDate.setDate(startDate.getDate() - 1);
  }

  const weeks = [];
  let currentWeek = [];
  const cursor = new Date(startDate);

  while (cursor <= today) {
    const dateStr = cursor.toISOString().split('T')[0];
    const dayOfWeek = cursor.getDay();
    // Convert to Mon=0 ... Sun=6
    const dayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    currentWeek[dayIdx] = { date: dateStr, volume: volumeByDate[dateStr] || 0 };

    if (dayIdx === 6 || cursor.toDateString() === today.toDateString()) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  // Find max volume for color scaling
  const allVols = Object.values(volumeByDate).filter(v => v > 0);
  const maxVol = allVols.length ? Math.max(...allVols) : 1;

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

  const getColor = (vol) => {
    if (vol <= 0) return 'var(--bg-input)';
    const pct = vol / maxVol;
    if (pct >= 0.75) return 'var(--accent)';
    if (pct >= 0.5) return 'rgba(255,58,58,0.7)';
    if (pct >= 0.25) return 'rgba(255,58,58,0.45)';
    return 'rgba(255,58,58,0.2)';
  };

  // Month labels
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, wIdx) => {
    const firstDay = week.find(d => d);
    if (firstDay) {
      const m = new Date(firstDay.date + 'T12:00:00').getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ weekIdx: wIdx, label: new Date(firstDay.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }) });
        lastMonth = m;
      }
    }
  });

  container.innerHTML = `
    <div style="display:flex;gap:2px;">
      <!-- Day labels column -->
      <div style="display:flex;flex-direction:column;gap:2px;padding-top:18px;">
        ${dayLabels.map(l => `<div style="width:24px;height:13px;font-size:9px;color:var(--text-muted);display:flex;align-items:center;">${l}</div>`).join('')}
      </div>
      <!-- Weeks grid -->
      <div style="display:flex;flex-direction:column;">
        <!-- Month labels -->
        <div style="display:flex;gap:2px;height:16px;margin-bottom:2px;">
          ${weeks.map((_, wIdx) => {
            const label = monthLabels.find(m => m.weekIdx === wIdx);
            return `<div style="width:13px;font-size:9px;color:var(--text-muted);white-space:nowrap;overflow:visible;">${label ? label.label : ''}</div>`;
          }).join('')}
        </div>
        <!-- Grid -->
        <div style="display:flex;gap:2px;">
          ${weeks.map(week => `
            <div style="display:flex;flex-direction:column;gap:2px;">
              ${[0,1,2,3,4,5,6].map(dayIdx => {
                const day = week[dayIdx];
                if (!day) return `<div style="width:13px;height:13px;"></div>`;
                const color = getColor(day.volume);
                const title = day.volume > 0
                  ? `${new Date(day.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}: ${day.volume.toLocaleString()} lbs`
                  : new Date(day.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ': Rest day';
                return `<div style="width:13px;height:13px;border-radius:2px;background:${color};cursor:pointer;" title="${title}"></div>`;
              }).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    <!-- Stats summary -->
    <div style="display:flex;gap:24px;margin-top:16px;">
      <div>
        <span class="font-display" style="font-size:24px;font-weight:700;color:var(--accent);">${Object.keys(volumeByDate).length}</span>
        <span style="font-size:12px;color:var(--text-muted);"> workouts logged</span>
      </div>
      <div>
        <span class="font-display" style="font-size:24px;font-weight:700;color:var(--green);">${calculateStreak(volumeByDate)}</span>
        <span style="font-size:12px;color:var(--text-muted);"> day current streak</span>
      </div>
    </div>`;
}

// Calculates how many consecutive recent days you've worked out
function calculateStreak(volumeByDate) {
  let streak = 0;
  const d = new Date();
  // Check if today has a workout, if not start from yesterday
  const todayStr = d.toISOString().split('T')[0];
  if (!volumeByDate[todayStr]) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    if (volumeByDate[dateStr]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// =============================================
// WATER ANALYTICS — 30-day water intake chart
// =============================================
async function renderWaterAnalytics() {
  const thirtyAgo = new Date();
  thirtyAgo.setDate(thirtyAgo.getDate() - 30);
  const startStr = thirtyAgo.toISOString().split('T')[0];

  const { data } = await db
    .from('water_intake')
    .select('*')
    .eq('user_id', currentUser.user_id)
    .gte('date', startStr)
    .order('date', { ascending: true });

  const container = document.getElementById('waterAnalyticsChart');

  if (!data || !data.length) {
    container.innerHTML = '<div class="empty-state"><p>Start tracking water to see stats here</p></div>';
    return;
  }

  const maxGlasses = Math.max(...data.map(d => d.glasses), 1);
  const avgGlasses = (data.reduce((s, d) => s + d.glasses, 0) / data.length).toFixed(1);
  const daysHitGoal = data.filter(d => d.glasses >= (waterGoal || 64)).length;

  container.innerHTML = `
    <div style="display:flex;gap:24px;margin-bottom:16px;">
      <div>
        <span class="font-display" style="font-size:24px;font-weight:700;color:var(--blue);">${avgGlasses}</span>
        <span style="font-size:12px;color:var(--text-muted);"> avg oz/day</span>
      </div>
      <div>
        <span class="font-display" style="font-size:24px;font-weight:700;color:var(--green);">${daysHitGoal}</span>
        <span style="font-size:12px;color:var(--text-muted);"> days hit goal</span>
      </div>
    </div>
    <div style="display:flex;align-items:flex-end;gap:2px;height:120px;">
      ${data.map(d => {
        const pct = (d.glasses / maxGlasses) * 100;
        const dateLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const color = d.glasses >= (waterGoal || 64) ? 'var(--green)' : 'var(--blue)';
        return `<div style="flex:1;height:${Math.max(pct, 3)}%;background:${color};border-radius:2px 2px 0 0;min-height:3px;position:relative;cursor:pointer;" title="${dateLabel}: ${d.glasses} oz"></div>`;
      }).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-top:4px;">
      <span>${new Date(data[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      <span>${new Date(data[data.length - 1].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
    </div>`;
}
