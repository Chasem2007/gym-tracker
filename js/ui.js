/*
  =============================================
  ui.js — USER INTERFACE HELPERS
  =============================================
  Page navigation, toast popups, modal windows,
  and the mobile sidebar toggle.
  =============================================
*/

// Shows a brief notification at the bottom-right corner.
// type = 'success' (green border) or 'error' (red border)
// It auto-disappears after 3 seconds.
function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// Switches which page is visible.
// 1. Hides all pages
// 2. Shows the one matching 'id'
// 3. Highlights that sidebar button
// 4. Loads fresh data for that page
function showPage(id) {
  // Hide all pages (anything with id starting with "page-")
  document.querySelectorAll('[id^="page-"]').forEach(p => p.classList.add('hidden'));
  // Show the selected one
  document.getElementById('page-' + id).classList.remove('hidden');
  // Update sidebar highlights
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector(`.nav-item[data-page="${id}"]`);
  if (nav) nav.classList.add('active');
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  // Load the page's data from Supabase
  if (id === 'dashboard') loadDashboard();
  if (id === 'library') renderLibrary();
  if (id === 'weight') loadWeightData();
  if (id === 'calories') loadCalorieData();
  if (id === 'history') loadHistory();
  if (id === 'admin') loadMembers();
}

// Toggles the sidebar open/closed on mobile
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// Closes any open modal popup
function closeModal() {
  document.getElementById('modalContainer').innerHTML = '';
}
