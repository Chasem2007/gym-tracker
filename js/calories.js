/*
  =============================================
  calories.js — NUTRITION TRACKER (PRO)
  =============================================
  Full calorie + macro diary with daily totals,
  macro progress bars, 7-day overview, and
  quick-add presets.

  Supabase 'calories' table should have:
    user_id, date, food_name, calories,
    protein (g), carbs (g), fat (g)

  If carbs/fat columns don't exist yet, run:
    ALTER TABLE calories ADD COLUMN IF NOT EXISTS carbs numeric(6,1);
    ALTER TABLE calories ADD COLUMN IF NOT EXISTS fat numeric(6,1);
  =============================================
*/

const QUICK_ADD_PRESETS = [
  { name: 'Chicken Breast 150g', calories: 248, protein: 46, carbs: 0,   fat: 5  },
  { name: 'White Rice 1 cup',    calories: 242, protein: 4,  carbs: 53,  fat: 0  },
  { name: 'Whole Egg',           calories: 78,  protein: 6,  carbs: 1,   fat: 5  },
  { name: 'Greek Yogurt 200g',   calories: 130, protein: 20, carbs: 9,   fat: 0  },
  { name: 'Oats 80g',            calories: 303, protein: 10, carbs: 54,  fat: 5  },
  { name: 'Banana',              calories: 105, protein: 1,  carbs: 27,  fat: 0  },
  { name: 'Protein Shake',       calories: 150, protein: 25, carbs: 7,   fat: 3  },
  { name: 'Almonds 30g',         calories: 174, protein: 6,  carbs: 6,   fat: 15 },
  { name: 'Sweet Potato 200g',   calories: 172, protein: 3,  carbs: 40,  fat: 0  },
  { name: 'Salmon 150g',         calories: 280, protein: 39, carbs: 0,   fat: 13 },
];

function getNutritionGoals() {
  const saved = localStorage.getItem('ironlog_nutrition_goals');
  if (saved) return JSON.parse(saved);
  return { calories: 2500, protein: 180, carbs: 250, fat: 70 };
}

function saveNutritionGoals(goals) {
  localStorage.setItem('ironlog_nutrition_goals', JSON.stringify(goals));
}

async function loadCalorieData() {
  if (!isPro()) {
    showUpgradePrompt('calories-content', 'Nutrition Tracking');
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('calorieDate').value = todayStr;

  const goals = getNutritionGoals();
  document.getElementById('calorieGoal').value = goals.calories;
  document.getElementById('calorieGoalDisplay').textContent = goals.calories;

  // Today + last 7 days
  const sevenAgo = new Date();
  sevenAgo.setDate(sevenAgo.getDate() - 6);
  const startStr = sevenAgo.toISOString().split('T')[0];

  const { data } = await db.from('calories')
    .select('*')
    .eq('user_id', currentUser.user_id)
    .gte('date', startStr)
    .order('created_at', { ascending: false });

  const allEntries = data || [];
  const todayEntries = allEntries.filter(e => e.date === todayStr);

  // Totals for today
  const totals = {
    calories: todayEntries.reduce((s, e) => s + (e.calories || 0), 0),
    protein:  todayEntries.reduce((s, e) => s + (parseFloat(e.protein) || 0), 0),
    carbs:    todayEntries.reduce((s, e) => s + (parseFloat(e.carbs) || 0), 0),
    fat:      todayEntries.reduce((s, e) => s + (parseFloat(e.fat) || 0), 0),
  };

  // Update calorie ring
  const pct = Math.min(totals.calories / goals.calories, 1);
  const circumference = 2 * Math.PI * 78;
  document.getElementById('calorieTodayValue').textContent = Math.round(totals.calories);
  document.getElementById('calorieArc').setAttribute('stroke-dasharray', `${pct * circumference} ${circumference}`);
  const color = pct >= 1 ? 'var(--green)' : pct >= 0.8 ? 'var(--yellow)' : 'var(--accent)';
  document.getElementById('calorieArc').setAttribute('stroke', color);

  // Macro bars
  renderMacroBars(totals, goals);

  // Today's log
  renderCalorieLog(todayEntries);

  // 7-day chart
  render7DayChart(allEntries, goals.calories);

  // Quick add
  renderQuickAdd();
}

function renderMacroBars(totals, goals) {
  const container = document.getElementById('macroBars');
  if (!container) return;

  const macros = [
    { key: 'protein', label: 'Protein', color: '#4a9eff', unit: 'g' },
    { key: 'carbs',   label: 'Carbs',   color: 'var(--yellow)', unit: 'g' },
    { key: 'fat',     label: 'Fat',     color: '#fb923c', unit: 'g' },
  ];

  container.innerHTML = macros.map(m => {
    const val = Math.round(totals[m.key]);
    const goal = goals[m.key];
    const pct = Math.min((val / goal) * 100, 100);
    return `
      <div class="macro-bar-row">
        <div class="macro-bar-label-row">
          <span style="font-size:13px;font-weight:600;">${m.label}</span>
          <span style="font-size:13px;color:var(--text-muted);">${val}<span style="font-size:11px;">/${goal}${m.unit}</span></span>
        </div>
        <div class="macro-bar-track">
          <div class="macro-bar-fill" style="width:${pct}%;background:${m.color};"></div>
        </div>
      </div>`;
  }).join('');
}

function renderCalorieLog(entries) {
  const table = document.getElementById('calorieLogTable');
  if (!table) return;
  if (!entries.length) {
    table.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px;">No entries today</td></tr>';
    return;
  }
  table.innerHTML = entries.map(e => `
    <tr>
      <td style="color:var(--text-primary)">${e.food_name || '—'}</td>
      <td style="font-weight:600;color:var(--accent)">${e.calories}</td>
      <td style="color:#4a9eff">${e.protein ? Math.round(e.protein) + 'g' : '—'}</td>
      <td style="color:var(--yellow)">${e.carbs != null ? Math.round(e.carbs) + 'g' : '—'}</td>
      <td style="color:#fb923c">${e.fat != null ? Math.round(e.fat) + 'g' : '—'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteCalorie(${e.id})">×</button></td>
    </tr>`).join('');
}

function render7DayChart(allEntries, calorieGoal) {
  const container = document.getElementById('calorie7DayChart');
  if (!container) return;

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayEntries = allEntries.filter(e => e.date === dateStr);
    const total = dayEntries.reduce((s, e) => s + (e.calories || 0), 0);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    days.push({ dateStr, total, label });
  }

  const maxVal = Math.max(...days.map(d => d.total), calorieGoal);

  container.innerHTML = `
    <div style="display:flex;align-items:flex-end;gap:6px;height:100px;">
      ${days.map(d => {
        const h = Math.max((d.total / maxVal) * 100, d.total > 0 ? 4 : 0);
        const color = d.total >= calorieGoal ? 'var(--green)' : 'var(--accent)';
        return `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;gap:0;">
            <div style="flex:1;width:100%;display:flex;align-items:flex-end;">
              <div style="width:100%;height:${h}%;background:${color};border-radius:3px 3px 0 0;min-height:${d.total>0?3:0}px;" title="${d.label}: ${Math.round(d.total)} kcal"></div>
            </div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:4px;">${d.label}</div>
          </div>`;
      }).join('')}
    </div>`;
}

function renderQuickAdd() {
  const container = document.getElementById('quickAddGrid');
  if (!container) return;
  container.innerHTML = QUICK_ADD_PRESETS.map((p, i) => `
    <div class="quick-add-item" onclick="quickAddPreset(${i})">
      <div style="font-size:12px;font-weight:600;">${p.name}</div>
      <div style="font-size:11px;color:var(--text-muted);">${p.calories} kcal · P:${p.protein}g</div>
    </div>`).join('');
}

async function quickAddPreset(idx) {
  const p = QUICK_ADD_PRESETS[idx];
  const date = document.getElementById('calorieDate').value || new Date().toISOString().split('T')[0];
  const { error } = await db.from('calories').insert({
    user_id: currentUser.user_id,
    date, food_name: p.name, calories: p.calories,
    protein: p.protein, carbs: p.carbs, fat: p.fat
  });
  if (error) { showToast('Error adding', 'error'); return; }
  showToast(p.name + ' added!');
  loadCalorieData();
}

async function saveCalorieEntry() {
  const date = document.getElementById('calorieDate').value;
  const food_name = document.getElementById('calorieFoodName').value.trim();
  const calories = parseInt(document.getElementById('calorieAmount').value);
  const protein = parseFloat(document.getElementById('calorieProtein').value) || null;
  const carbs = parseFloat(document.getElementById('calorieCarbs')?.value) || null;
  const fat = parseFloat(document.getElementById('calorieFat')?.value) || null;

  if (!calories) { showToast('Enter calories', 'error'); return; }

  await db.from('calories').insert({
    user_id: currentUser.user_id,
    date, food_name, calories, protein, carbs, fat
  });

  showToast('Logged!');
  document.getElementById('calorieFoodName').value = '';
  document.getElementById('calorieAmount').value = '';
  document.getElementById('calorieProtein').value = '';
  if (document.getElementById('calorieCarbs')) document.getElementById('calorieCarbs').value = '';
  if (document.getElementById('calorieFat')) document.getElementById('calorieFat').value = '';
  loadCalorieData();
}

async function saveCalorieGoal() {
  const goals = getNutritionGoals();
  goals.calories = parseInt(document.getElementById('calorieGoal').value) || 2500;
  if (document.getElementById('goalProtein')) goals.protein = parseInt(document.getElementById('goalProtein').value) || 180;
  if (document.getElementById('goalCarbs'))   goals.carbs   = parseInt(document.getElementById('goalCarbs').value) || 250;
  if (document.getElementById('goalFat'))     goals.fat     = parseInt(document.getElementById('goalFat').value) || 70;
  saveNutritionGoals(goals);
  document.getElementById('calorieGoalDisplay').textContent = goals.calories;
  loadCalorieData();
}

async function deleteCalorie(id) {
  await db.from('calories').delete().eq('id', id);
  showToast('Deleted');
  loadCalorieData();
}
