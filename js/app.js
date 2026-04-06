/*
  =============================================
  app.js — APP STARTUP
  =============================================
  This runs when the page first loads.
  It checks if you're already logged in
  and sets up the Enter key on the login form.
  =============================================
*/

window.addEventListener('DOMContentLoaded', () => {
  // Immediately hide login page if we have a cached session so there's no flash
  if (localStorage.getItem('ironlog_session')) {
    document.getElementById('loginPage').classList.add('hidden');
  }

  // Check if you were previously logged in
  checkSession();

  // Let you press Enter to log in (instead of clicking the button)
  document.getElementById('loginPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('loginUser').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
});
