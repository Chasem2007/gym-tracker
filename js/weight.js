/*
  =============================================
  weight.js — BODY WEIGHT TRACKING
  =============================================
  Log daily weigh-ins, see a bar chart trend,
  and a history table showing gain/loss.
  =============================================
*/

// Saves a weight entry. Uses "upsert" which means:
// if an entry for that date already exists, update it;
// otherwise, create a new one.
async function saveWeight() {
  const date = document.getElementById('weightDate').value;
  const weight = parseFloat(document.getElementById('weightValue').value);

  if (!weight) { showToast('Enter a weight', 'error'); return; }

  const { error } = await db
    .from('body_weight')
    .upsert(
      { user_id: currentUser.user_id, date, weight },
      { onConflict: 'user_id,date' }  // unique combo = one entry per day
    );

  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('Weight logged!');
  document.getElementById('weightValue').value = '';
  loadWeightData();
}

// Loads weight data and renders the chart + table
async function loadWeightData() {
  const { data } = await db
    .from('body_weight')
    .select('*')
    .eq('user_id', currentUser.user_id)
    .order('date', { ascending: false })
    .limit(30);

  if (!data || !data.length) {
    document.getElementById('weightHistoryTable').innerHTML =
      '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px;">No entries yet</td></tr>';
    document.getElementById('weightChart').innerHTML = '';
    return;
  }

  // --- Bar Chart ---
  // Reverse so oldest is on the left
  const sorted = [...data].reverse();
  const minW = Math.min(...sorted.map(d => d.weight));
  const maxW = Math.max(...sorted.map(d => d.weight));
  const range = maxW - minW || 1;

  document.getElementById('weightChart').innerHTML = sorted.map(d => {
    // Scale bar height between 20% and 100%
    const pct = ((d.weight - minW) / range) * 80 + 20;
    const dateLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `<div class="weight-bar" style="height:${pct}%" data-label="${d.weight} lbs — ${dateLabel}"></div>`;
  }).join('');

  // Chart date labels
  document.getElementById('weightChartStart').textContent = sorted[0]
    ? new Date(sorted[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  document.getElementById('weightChartEnd').textContent = sorted.at(-1)
    ? new Date(sorted.at(-1).date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  // --- History Table ---
  document.getElementById('weightHistoryTable').innerHTML = data.map((d, i) => {
    const dateStr = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const prev = data[i + 1];  // previous entry (older)
    let change = '—';
    if (prev) {
      const diff = (d.weight - prev.weight).toFixed(1);
      if (diff > 0) change = `<span style="color:var(--green)">+${diff}</span>`;
      else if (diff < 0) change = `<span style="color:var(--accent)">${diff}</span>`;
      else change = '0.0';
    }
    return `<tr>
      <td>${dateStr}</td>
      <td style="color:var(--text-primary);font-weight:600;">${d.weight}</td>
      <td>${change}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteWeight(${d.id})">×</button></td>
    </tr>`;
  }).join('');
}

async function deleteWeight(id) {
  await db.from('body_weight').delete().eq('id', id);
  showToast('Deleted');
  loadWeightData();
}
