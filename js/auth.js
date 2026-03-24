/*
  =============================================
  auth.js — LOGIN / LOGOUT / SESSION
  =============================================
  Handles user authentication against the Supabase
  'users' table. Also saves your session in
  localStorage so you stay logged in on refresh.
  =============================================
*/

// Holds the currently logged-in user's data
let currentUser = null;

// Called when you click "LOG IN"
async function handleLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');

  if (!u || !p) {
    err.textContent = 'Please enter username and password.';
    err.style.display = 'block';
    return;
  }

  try {
    // Ask Supabase: "Is there a user with this username AND password?"
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('username', u)
      .eq('password', p)
      .single();  // .single() = expect exactly 1 result

    if (error || !data) {
      // Show the actual Supabase error so we can debug
      const detail = error ? error.message || error.code || JSON.stringify(error) : 'No user found';
      err.textContent = 'Login failed: ' + detail;
      err.style.display = 'block';
      console.error('Supabase login error:', error);
      return;
    }

    // Success! Save user and enter the app
    currentUser = data;
    localStorage.setItem('ironlog_session', JSON.stringify(data));
    enterApp();
  } catch (e) {
    err.textContent = 'Connection error: ' + (e.message || e);
    err.style.display = 'block';
    console.error('Connection error:', e);
  }
}

// Called when you click the logout icon
function handleLogout() {
  currentUser = null;
  localStorage.removeItem('ironlog_session');
  document.getElementById('appShell').classList.add('hidden');
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').style.display = 'none';
}

// Sets up the app UI after a successful login
function enterApp() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');

  // Show the user's name and initial in the sidebar
  document.getElementById('userName').textContent = currentUser.display_name || currentUser.username;
  document.getElementById('userAvatar').textContent = (currentUser.display_name || currentUser.username).charAt(0).toUpperCase();
  document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Super Admin' : 'Member';

  // Only show the Admin section for admin users
  document.getElementById('adminNavSection').classList.toggle('hidden', currentUser.role !== 'admin');

  // Pre-fill today's date on all date inputs
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('workoutDate').value = today;
  document.getElementById('weightDate').value = today;
  document.getElementById('calorieDate').value = today;

  // Go to dashboard
  showPage('dashboard');
}

// Runs on page load — checks if you were already logged in
function checkSession() {
  const s = localStorage.getItem('ironlog_session');
  if (s) {
    try {
      currentUser = JSON.parse(s);
      enterApp();
    } catch (e) {
      localStorage.removeItem('ironlog_session');
    }
  }
}
