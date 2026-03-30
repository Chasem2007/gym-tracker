/*
  =============================================
  water.js — WATER INTAKE TRACKING (ounces)
  =============================================
  Uses maybeSingle() instead of single() so the
  app doesn't crash when there's no data yet.
  single() throws an error if 0 rows found,
  maybeSingle() just returns null.
  =============================================
*/

let waterGoal = 64;  // default 64 oz

async function loadWaterData() {
  if (!currentUser) return;
  const todayStr = new Date().toISOString().split('T')[0];

  // Load goal and today's count in parallel
  const [profileResult, todayResult] = await Promise.all([
    db.from('user_settings')
      .select('water_goal')
      .eq('user_id', currentUser.user_id)
      .maybeSingle()
      .catch(() => ({ data: null })),
    db.from('water_intake')
      .select('glasses')
      .eq('user_id', currentUser.user_id)
      .eq('date', todayStr)
      .maybeSingle()
      .catch(() => ({ data: null }))
  ]);

  waterGoal = (profileResult.data && profileResult.data.water_goal) ? profileResult.data.water_goal : 64;

  document.getElementById('waterGoalInput').value = waterGoal;
  document.getElementById('waterGoalDisplay').textContent = waterGoal;

  let todayOz = (todayResult.data && todayResult.data.glasses) ? todayResult.data.glasses : 0;

  document.getElementById('waterCount').textContent = todayOz;

  // Update progress bar
  const pct = waterGoal > 0 ? Math.min((todayOz / waterGoal) * 100, 100) : 0;
  document.getElementById('waterProgressBar').style.width = pct + '%';
  document.getElementById('waterProgressBar').style.background =
    todayOz >= waterGoal ? 'var(--green)' : 'var(--blue)';

  // Load this week for the chart
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStr = weekAgo.toISOString().split('T')[0];

  const { data: weekData } = await db
    .from('water_intake')
    .select('*')
    .eq('user_id', currentUser.user_id)
    .gte('date', weekStr)
    .order('date', { ascending: true });

  renderWaterWeekChart(weekData || []);
}

function renderWaterWeekChart(weekData) {
  const container = document.getElementById('waterWeekChart');
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  const byDate = {};
  weekData.forEach(w => { byDate[w.date] = w.glasses; });

  container.innerHTML = days.map(date => {
    const oz = byDate[date] || 0;
    const pct = waterGoal > 0 ? (oz / waterGoal) * 100 : 0;
    const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    const color = oz >= waterGoal ? 'var(--green)' : 'var(--blue)';
    return `
      <div class="chart-bar-row">
        <div class="chart-bar-label">${dayLabel}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width:${Math.max(Math.min(pct, 100), 2)}%;background:${color};">
            ${oz > 0 ? oz + ' oz' : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

async function addWater(amount) {
  if (!currentUser) return;
  const todayStr = new Date().toISOString().split('T')[0];

  // Get current count (maybeSingle so it doesn't error on first use)
  let current = 0;
  try {
    const { data: existing } = await db
      .from('water_intake')
      .select('glasses')
      .eq('user_id', currentUser.user_id)
      .eq('date', todayStr)
      .maybeSingle();

    current = (existing && existing.glasses) ? existing.glasses : 0;
  } catch (e) {
    current = 0;
  }

  const newCount = Math.max(0, current + amount);

  // Upsert (insert or update)
  const { error } = await db.from('water_intake').upsert({
    user_id: currentUser.user_id,
    date: todayStr,
    glasses: newCount
  }, { onConflict: 'user_id,date' });

  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  showToast(amount > 0 ? 'Stay hydrated! 💧' : 'Updated');
  loadWaterData();
}

async function saveWaterGoal() {
  waterGoal = parseInt(document.getElementById('waterGoalInput').value) || 64;

  try {
    const { data: existing } = await db
      .from('user_settings')
      .select('user_id')
      .eq('user_id', currentUser.user_id)
      .maybeSingle();

    if (existing) {
      await db.from('user_settings')
        .update({ water_goal: waterGoal })
        .eq('user_id', currentUser.user_id);
    } else {
      await db.from('user_settings')
        .insert({ user_id: currentUser.user_id, water_goal: waterGoal });
    }
  } catch (e) {
    showToast('Error saving goal', 'error');
    return;
  }

  document.getElementById('waterGoalDisplay').textContent = waterGoal;
  showToast('Water goal updated!');
  loadWaterData();
}
