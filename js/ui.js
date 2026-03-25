/*
  =============================================
  ui.js — USER INTERFACE HELPERS
  =============================================
*/

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function showPage(id) {
  document.querySelectorAll('[id^="page-"]').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + id).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector(`.nav-item[data-page="${id}"]`);
  if (nav) nav.classList.add('active');
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('mobileOverlay').classList.remove('active');
  if (id === 'dashboard') loadDashboard();
  if (id === 'log') loadDraft();
  if (id === 'library') renderLibrary();
  if (id === 'weight') loadWeightData();
  if (id === 'calories') loadCalorieData();
  if (id === 'history') loadHistory();
  if (id === 'admin') loadMembers();
  if (id === 'water') loadWaterData();
  if (id === 'analytics') loadAnalytics();
  if (id === 'gympass') loadGymPassData();
  if (id === 'account') loadAccountData();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

function closeModal() {
  document.getElementById('modalContainer').innerHTML = '';
}
