/*
  =============================================
  water.js — WATER INTAKE TRACKING
  =============================================
  Track daily water in ounces, see a weekly chart,
  and set a daily hydration goal.
  =============================================
*/

let waterGoal = 64;  // default 64 oz (8 glasses)

async function loadWaterData() {
  const todayStr = new Date().toISOString().split('T')[0];

  // Load goal from user_settings
  const { data: profile } = await db
    .from('user_settings')
    .select('water_goal')
    .eq('user_id', currentUser.user_id)
    .single();

  waterGoal = profile?.water_goal || 8;
  document.getElementById('waterGoalInput').value = waterGoal;
  document.getElementById('waterGoalDisplay').textContent = waterGoal;

  // Load today's count
  const { data: todayData } = await db
    .from('water_intake')
    .select('glasses')
    .eq('user_id', currentUser.user_id)
    .eq('date', todayStr)
    .single();

  const todayGlasses = todayData?.glasses || 0;
  document.getElementById('waterCount').textContent = todayGlasses;

  // Update progress bar
  const pct = Math.min((todayGlasses / waterGoal) * 100, 100);
  document.getElementById('waterProgressBar').style.width = pct + '%';
  document.getElementById('waterProgressBar').style.background =
    todayGlasses >= waterGoal ? 'var(--green)' : 'var(--blue)';

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

  // Map dates to glass counts
  const byDate = {};
  weekData.forEach(w => { byDate[w.date] = w.glasses; });

  container.innerHTML = days.map(date => {
    const glasses = byDate[date] || 0;
    const pct = waterGoal > 0 ? (glasses / waterGoal) * 100 : 0;
    const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    const color = glasses >= waterGoal ? 'var(--green)' : 'var(--blue)';
    return `
      <div class="chart-bar-row">
        <div class="chart-bar-label">${dayLabel}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width:${Math.max(Math.min(pct, 100), 2)}%;background:${color};">
            ${glasses > 0 ? glasses + ' oz' : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

async function addWater(amount) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Get current count
  const { data: existing } = await db
    .from('water_intake')
    .select('glasses')
    .eq('user_id', currentUser.user_id)
    .eq('date', todayStr)
    .single();

  const current = existing?.glasses || 0;
  const newCount = Math.max(0, current + amount);

  // Upsert (insert or update)
  await db.from('water_intake').upsert({
    user_id: currentUser.user_id,
    date: todayStr,
    glasses: newCount
  }, { onConflict: 'user_id,date' });

  showToast(amount > 0 ? 'Stay hydrated! 💧' : 'Updated');
  loadWaterData();
}

async function saveWaterGoal() {
  waterGoal = parseInt(document.getElementById('waterGoalInput').value) || 8;

  // We need to add water_goal column if it doesn't exist.
  // For now, store in user_settings alongside calorie_goal.
  const { data: existing } = await db
    .from('user_settings')
    .select('*')
    .eq('user_id', currentUser.user_id)
    .single();

  if (existing) {
    await db.from('user_settings')
      .update({ water_goal: waterGoal })
      .eq('user_id', currentUser.user_id);
  } else {
    await db.from('user_settings')
      .insert({ user_id: currentUser.user_id, water_goal: waterGoal });
  }

  document.getElementById('waterGoalDisplay').textContent = waterGoal;
  showToast('Water goal updated!');
  loadWaterData();
}
