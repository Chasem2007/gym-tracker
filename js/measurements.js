/*
  =============================================
  measurements.js — BODY MEASUREMENTS (PRO)
  =============================================
  SQL to run in Supabase:

  CREATE TABLE measurements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(user_id) on delete cascade,
    date date not null,
    body_fat_pct numeric(4,1),
    waist_cm numeric(5,1),
    chest_cm numeric(5,1),
    hips_cm numeric(5,1),
    bicep_cm numeric(5,1),
    thigh_cm numeric(5,1),
    neck_cm numeric(5,1),
    notes text,
    created_at timestamptz default now()
  );
  =============================================
*/

const MEASUREMENT_FIELDS = [
  { key: 'body_fat_pct', label: 'Body Fat %',   unit: '%',  placeholder: '15.0' },
  { key: 'waist_cm',     label: 'Waist',         unit: 'cm', placeholder: '80.0' },
  { key: 'chest_cm',     label: 'Chest',         unit: 'cm', placeholder: '100.0' },
  { key: 'hips_cm',      label: 'Hips',          unit: 'cm', placeholder: '95.0' },
  { key: 'bicep_cm',     label: 'Bicep',         unit: 'cm', placeholder: '35.0' },
  { key: 'thigh_cm',     label: 'Thigh',         unit: 'cm', placeholder: '55.0' },
  { key: 'neck_cm',      label: 'Neck',          unit: 'cm', placeholder: '38.0' },
];

async function loadMeasurements() {
  if (!isPro()) {
    showUpgradePrompt('measurements-content', 'Body Measurements');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('measDate').value = today;

  const { data } = await db.from('measurements')
    .select('*')
    .eq('user_id', currentUser.user_id)
    .order('date', { ascending: false });

  renderMeasurementHistory(data || []);
  renderMeasurementCharts(data || []);
}

async function saveMeasurement() {
  const date = document.getElementById('measDate').value;
  if (!date) { showToast('Select a date', 'error'); return; }

  const payload = { user_id: currentUser.user_id, date };
  let hasAny = false;

  MEASUREMENT_FIELDS.forEach(f => {
    const val = document.getElementById('meas_' + f.key)?.value;
    if (val && val !== '') {
      payload[f.key] = parseFloat(val);
      hasAny = true;
    }
  });

  const notes = document.getElementById('measNotes')?.value?.trim();
  if (notes) payload.notes = notes;

  if (!hasAny) { showToast('Enter at least one measurement', 'error'); return; }

  const { error } = await db.from('measurements').insert(payload);
  if (error) { showToast('Error saving: ' + error.message, 'error'); return; }

  // Clear inputs
  MEASUREMENT_FIELDS.forEach(f => {
    const el = document.getElementById('meas_' + f.key);
    if (el) el.value = '';
  });
  if (document.getElementById('measNotes')) document.getElementById('measNotes').value = '';

  showToast('Measurements saved!');
  loadMeasurements();
}

async function deleteMeasurement(id) {
  if (!confirm('Delete this entry?')) return;
  await db.from('measurements').delete().eq('id', id);
  showToast('Entry deleted');
  loadMeasurements();
}

function renderMeasurementHistory(entries) {
  const container = document.getElementById('measHistory');
  if (!container) return;

  if (!entries.length) {
    container.innerHTML = '<div class="empty-state"><p>No measurements logged yet</p></div>';
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>Date</th>
        ${MEASUREMENT_FIELDS.map(f => `<th>${f.label}</th>`).join('')}
        <th></th>
      </tr></thead>
      <tbody>
        ${entries.map(e => `
          <tr>
            <td>${new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            ${MEASUREMENT_FIELDS.map(f => `<td>${e[f.key] != null ? e[f.key] + ' ' + f.unit : '—'}</td>`).join('')}
            <td><button class="btn btn-danger btn-sm" onclick="deleteMeasurement('${e.id}')">✕</button></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderMeasurementCharts(entries) {
  if (entries.length < 2) return;
  const container = document.getElementById('measCharts');
  if (!container) return;

  // For each field that has at least 2 data points, show a sparkline-style trend
  const last8 = entries.slice(0, 8).reverse();

  const chartsHtml = MEASUREMENT_FIELDS
    .filter(f => last8.filter(e => e[f.key] != null).length >= 2)
    .map(f => {
      const points = last8.filter(e => e[f.key] != null);
      const vals = points.map(e => parseFloat(e[f.key]));
      const minV = Math.min(...vals), maxV = Math.max(...vals);
      const range = maxV - minV || 0.1;
      const latest = vals[vals.length - 1];
      const prev = vals[vals.length - 2];
      const trend = latest > prev ? '▲' : latest < prev ? '▼' : '→';
      const trendColor = f.key === 'body_fat_pct' || f.key === 'waist_cm' || f.key === 'hips_cm'
        ? (latest < prev ? 'var(--green)' : 'var(--accent)')
        : (latest > prev ? 'var(--green)' : 'var(--accent)');

      const svgPoints = vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * 100;
        const y = 4 + (1 - (v - minV) / range) * 28;
        return `${x},${y}`;
      }).join(' ');

      return `
        <div class="meas-chart-card">
          <div class="meas-chart-label">${f.label}</div>
          <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:4px;">
            <span class="font-display" style="font-size:22px;font-weight:700;">${latest}</span>
            <span style="font-size:11px;color:var(--text-muted);">${f.unit}</span>
            <span style="color:${trendColor};font-size:13px;margin-left:4px;">${trend}</span>
          </div>
          <svg width="100%" height="36" viewBox="0 0 100 36" preserveAspectRatio="none">
            <polyline points="${svgPoints}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-top:2px;">
            <span>${new Date(points[0].date + 'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
            <span>${new Date(points[points.length-1].date + 'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
          </div>
        </div>`;
    }).join('');

  container.innerHTML = chartsHtml
    ? `<div class="meas-charts-grid">${chartsHtml}</div>`
    : '';
}
