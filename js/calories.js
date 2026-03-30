/*
  =============================================
  calories.js — CALORIE TRACKER
  =============================================
  Log food entries with calories and protein,
  see a circular progress ring for your daily
  goal, and manage your daily target.
  =============================================
*/

async function loadCalorieData() {
  const todayStr = new Date().toISOString().split('T')[0];

  // Load calorie goal and today's entries in parallel
  const [{ data: profile }, { data }] = await Promise.all([
    db.from('user_settings')
      .select('calorie_goal')
      .eq('user_id', currentUser.user_id)
      .maybeSingle(),
    db.from('calories')
      .select('*')
      .eq('user_id', currentUser.user_id)
      .eq('date', todayStr)
      .order('created_at', { ascending: false })
  ]);

  const goal = profile?.calorie_goal || 2500;
  document.getElementById('calorieGoal').value = goal;
  document.getElementById('calorieGoalDisplay').textContent = goal;

  const total = data ? data.reduce((sum, c) => sum + (c.calories || 0), 0) : 0;
  document.getElementById('calorieTodayValue').textContent = total;

  // Update the circular progress ring
  // It works by changing the SVG 'stroke-dasharray' property —
  // this controls how much of the circle's outline is drawn.
  const pct = Math.min(total / goal, 1);
  const circumference = 2 * Math.PI * 78;  // 78 = circle radius
  document.getElementById('calorieArc').setAttribute(
    'stroke-dasharray', `${pct * circumference} ${circumference}`
  );

  // Color: red while low, yellow near goal, green when hit
  const color = pct >= 1 ? 'var(--green)' : pct >= 0.8 ? 'var(--yellow)' : 'var(--accent)';
  document.getElementById('calorieArc').setAttribute('stroke', color);

  // Today's log table
  const table = document.getElementById('calorieLogTable');
  if (!data || !data.length) {
    table.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px;">No entries today</td></tr>';
    return;
  }
  table.innerHTML = data.map(c => `
    <tr>
      <td style="color:var(--text-primary)">${c.food_name || '—'}</td>
      <td style="font-weight:600;color:var(--accent)">${c.calories}</td>
      <td>${c.protein ? c.protein + 'g' : '—'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteCalorie(${c.id})">×</button></td>
    </tr>`).join('');
}

// Saves a new food/calorie entry
async function saveCalorieEntry() {
  const date = document.getElementById('calorieDate').value;
  const food_name = document.getElementById('calorieFoodName').value.trim();
  const calories = parseInt(document.getElementById('calorieAmount').value);
  const protein = parseInt(document.getElementById('calorieProtein').value) || null;

  if (!calories) { showToast('Enter calories', 'error'); return; }

  await db.from('calories').insert({
    user_id: currentUser.user_id,
    date, food_name, calories, protein
  });

  showToast('Calories logged!');
  document.getElementById('calorieFoodName').value = '';
  document.getElementById('calorieAmount').value = '';
  document.getElementById('calorieProtein').value = '';
  loadCalorieData();
}

// Saves the daily calorie goal to user_settings
async function saveCalorieGoal() {
  const goal = parseInt(document.getElementById('calorieGoal').value) || 2500;
  await db.from('user_settings').upsert(
    { user_id: currentUser.user_id, calorie_goal: goal },
    { onConflict: 'user_id' }
  );
  document.getElementById('calorieGoalDisplay').textContent = goal;
  loadCalorieData();
}

async function deleteCalorie(id) {
  await db.from('calories').delete().eq('id', id);
  showToast('Deleted');
  loadCalorieData();
}
