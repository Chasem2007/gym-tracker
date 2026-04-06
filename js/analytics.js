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

  if (!isPro()) {
    showUpgradePrompt('analytics-content', 'Analytics');
    return;
  }

  showLoading('prBoard');
  showLoading('strengthChart');
  showLoading('workoutHeatmap');
  showLoading('waterAnalyticsChart');
  const uid = currentUser.user_id;

  const thirtyAgo = new Date();
  thirtyAgo.setDate(thirtyAgo.getDate() - 30);
  const startStr = thirtyAgo.toISOString().split('T')[0];

  // Load workouts and water data in parallel
  const [{ data: allWorkouts }, { data: waterData }] = await Promise.all([
    db.from('workouts')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: true }),
    db.from('water_intake')
      .select('*')
      .eq('user_id', uid)
      .gte('date', startStr)
      .order('date', { ascending: true })
  ]);

  const workouts = allWorkouts || [];

  renderPRBoard(workouts);
  populateStrengthSelect(workouts);
  renderHeatmap(workouts);
  renderWaterAnalytics(waterData || []);
  renderStrengthScore(workouts);
  renderMuscleVolumeTrend(workouts);
  renderTopLiftsSparklines(workouts);
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
function renderWaterAnalytics(data) {
  const container = document.getElementById('waterAnalyticsChart');

  if (!data || !data.length) {
    container.innerHTML = '<div class="empty-state"><p>Start tracking water to see stats here</p></div>';
    return;
  }

  const maxGlasses = Math.max(...data.map(d => d.glasses), 1);
  const avgGlasses = (data.reduce((s, d) => s + d.glasses, 0) / data.length).toFixed(1);
  const daysHitGoal = data.filter(d => d.glasses >= (waterGoal || 64)).length;

  const waterGoal = parseInt(localStorage.getItem('ironlog_water_goal')) || 64;
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

// =============================================
// STRENGTH SCORE — Composite e1RM from benchmark lifts
// =============================================
function renderStrengthScore(workouts) {
  const container = document.getElementById('strengthScoreSection');
  const BENCHMARKS = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row'];
  const best = {};

  workouts.forEach(w => {
    const exs = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []);
    exs.forEach(ex => {
      const match = BENCHMARKS.find(b => ex.name && ex.name.toLowerCase().includes(b.toLowerCase()));
      if (!match) return;
      (ex.sets || []).forEach(s => {
        const weight = parseFloat(s.weight) || 0;
        const reps = parseInt(s.reps) || 0;
        if (weight <= 0 || reps <= 0) return;
        const e1rm = weight * (1 + reps / 30);
        if (!best[match] || e1rm > best[match]) best[match] = e1rm;
      });
    });
  });

  const entries = BENCHMARKS.filter(b => best[b]);
  if (!entries.length) {
    container.innerHTML = '<div class="empty-state"><p>Log Bench Press, Squat, Deadlift, OHP, or Barbell Row to see your score</p></div>';
    return;
  }

  const totalScore = Math.round(entries.reduce((sum, b) => sum + best[b], 0));
  const pct = Math.min((totalScore / 2000) * 100, 100);

  container.innerHTML = `
    <div style="text-align:center;margin-bottom:20px;">
      <div class="font-display" style="font-size:64px;font-weight:700;color:var(--accent);line-height:1;">${totalScore.toLocaleString()}</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">Total Strength Score (lbs e1RM)</div>
    </div>
    <div class="strength-score-bar-track">
      <div class="strength-score-bar-fill" style="width:${pct}%;"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:4px;margin-bottom:20px;">
      <span>0</span><span>2,000</span>
    </div>
    <div class="strength-score-breakdown">
      ${BENCHMARKS.map(b => {
        const val = best[b] ? Math.round(best[b]) : null;
        return `
          <div class="strength-score-lift${val ? '' : ' strength-score-lift--missing'}">
            <span class="strength-score-lift-name">${b}</span>
            <span class="strength-score-lift-val">${val ? val + ' lbs' : '—'}</span>
          </div>`;
      }).join('')}
    </div>`;
}

// =============================================
// MUSCLE VOLUME TREND — Sets per muscle group per week
// =============================================
function renderMuscleVolumeTrend(workouts) {
  const container = document.getElementById('muscleVolumeTrend');
  const MUSCLES = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
  const COLORS = {
    chest: 'var(--accent)', back: '#4a9eff', legs: 'var(--green)',
    shoulders: 'var(--yellow)', arms: '#a78bfa', core: '#fb923c'
  };

  const now = new Date();
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    weeks.push({ start: weekStart, end: weekEnd, label, sets: Object.fromEntries(MUSCLES.map(m => [m, 0])) });
  }

  workouts.forEach(w => {
    const date = new Date(w.date + 'T12:00:00');
    const week = weeks.find(wk => date >= wk.start && date <= wk.end);
    if (!week) return;
    const exs = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []);
    exs.forEach(ex => {
      const setCount = (ex.sets || []).length;
      (ex.muscles || []).forEach(m => {
        const key = m.toLowerCase();
        if (week.sets[key] !== undefined) week.sets[key] += setCount;
      });
    });
  });

  let activeTab = MUSCLES[0];

  function renderChart(muscle) {
    const color = COLORS[muscle];
    const vals = weeks.map(wk => wk.sets[muscle]);
    const maxVal = Math.max(...vals, 1);
    return `
      <div class="mvt-chart">
        ${weeks.map((wk, i) => {
          const h = Math.max((vals[i] / maxVal) * 100, vals[i] > 0 ? 4 : 0);
          return `
            <div class="mvt-bar-col">
              <div class="mvt-bar-wrap">
                <div class="mvt-bar" style="height:${h}%;background:${color};" title="${wk.label}: ${vals[i]} sets"></div>
              </div>
              <div class="mvt-bar-label">${wk.label}</div>
            </div>`;
        }).join('')}
      </div>`;
  }

  function build() {
    container.innerHTML = `
      <div class="tabs" style="margin-bottom:16px;flex-wrap:wrap;">
        ${MUSCLES.map(m => `
          <button class="tab-btn${m === activeTab ? ' active' : ''}"
            style="${m === activeTab ? `border-color:${COLORS[m]};color:${COLORS[m]};` : ''}"
            onclick="(function(){window._mvtActiveTab='${m}';document.getElementById('muscleVolumeTrend')._rebuild();})()">
            ${m.charAt(0).toUpperCase() + m.slice(1)}
          </button>`).join('')}
      </div>
      ${renderChart(activeTab)}`;

    container._rebuild = () => {
      activeTab = window._mvtActiveTab || MUSCLES[0];
      build();
    };
  }

  build();
}

// =============================================
// TOP LIFTS SPARKLINES — 6 most-logged exercises
// =============================================
function renderTopLiftsSparklines(workouts) {
  const container = document.getElementById('topLiftsSparklines');
  const exerciseData = {};

  workouts.forEach(w => {
    const exs = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []);
    exs.forEach(ex => {
      if (!ex.name) return;
      if (!exerciseData[ex.name]) exerciseData[ex.name] = { sessions: 0, history: [] };
      let bestE1rm = 0;
      (ex.sets || []).forEach(s => {
        const weight = parseFloat(s.weight) || 0;
        const reps = parseInt(s.reps) || 0;
        if (weight > 0 && reps > 0) {
          const e1rm = weight * (1 + reps / 30);
          if (e1rm > bestE1rm) bestE1rm = e1rm;
        }
      });
      if (bestE1rm > 0) {
        exerciseData[ex.name].sessions++;
        exerciseData[ex.name].history.push({ date: w.date, e1rm: bestE1rm });
      }
    });
  });

  const top6 = Object.entries(exerciseData)
    .sort((a, b) => b[1].sessions - a[1].sessions)
    .slice(0, 6);

  if (!top6.length) {
    container.innerHTML = '<div class="empty-state"><p>Log workouts to see your top lifts</p></div>';
    return;
  }

  function sparkline(history) {
    const last10 = history.slice(-10);
    if (last10.length < 2) return `<svg width="100" height="36" viewBox="0 0 100 36"><line x1="0" y1="18" x2="100" y2="18" stroke="var(--accent)" stroke-width="1.5" stroke-opacity="0.4"/></svg>`;
    const vals = last10.map(p => p.e1rm);
    const minV = Math.min(...vals), maxV = Math.max(...vals);
    const range = maxV - minV || 1;
    const points = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * 100;
      const y = 4 + (1 - (v - minV) / range) * 28;
      return `${x},${y}`;
    }).join(' ');
    return `<svg width="100" height="36" viewBox="0 0 100 36"><polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function trendArrow(history) {
    const last = history.slice(-6);
    if (last.length < 2) return '<span style="color:var(--text-muted);">→</span>';
    const diff = ((last[last.length-1].e1rm - last[0].e1rm) / last[0].e1rm) * 100;
    if (diff > 2) return '<span style="color:var(--green);">▲</span>';
    if (diff < -2) return '<span style="color:var(--accent);">▼</span>';
    return '<span style="color:var(--text-muted);">→</span>';
  }

  container.innerHTML = `
    <div class="sparklines-grid">
      ${top6.map(([name, data]) => {
        const currentE1rm = Math.round(data.history[data.history.length - 1]?.e1rm || 0);
        return `
          <div class="sparkline-card">
            <div class="sparkline-header">
              <span class="sparkline-name">${name}</span>
              ${trendArrow(data.history)}
            </div>
            <div class="sparkline-e1rm">
              <span class="font-display" style="font-size:26px;font-weight:700;color:var(--accent);">${currentE1rm}</span>
              <span style="font-size:11px;color:var(--text-muted);"> lbs e1RM</span>
            </div>
            <div>${sparkline(data.history)}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:6px;">${data.sessions} session${data.sessions !== 1 ? 's' : ''}</div>
          </div>`;
      }).join('')}
    </div>`;
}
