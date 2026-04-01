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

// ===== LANDING NAVIGATION =====

function showLanding() {
  document.getElementById('landingView').classList.remove('hidden');
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('signupOverlay').style.display = 'none';
  document.getElementById('loginError').style.display = 'none';
}

function showLoginForm() {
  document.getElementById('landingView').classList.add('hidden');
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('signupOverlay').style.display = 'none';
}

function showSignUp() {
  document.getElementById('signupOverlay').style.display = 'flex';
  // Populate gym dropdown
  const select = document.getElementById('signupGymSelect');
  select.innerHTML = '<option value="">— Choose your gym —</option>' +
    SUPPORTED_GYMS.map(g => `<option value="${g.name}">${g.name}</option>`).join('');
  signupGoTo(1);
  document.getElementById('signupError').style.display = 'none';
}

function signupGoTo(step) {
  document.querySelectorAll('#signupOverlay .setup-step').forEach(s => s.classList.remove('active'));
  document.getElementById('signupStep' + step).classList.add('active');
  for (let i = 1; i <= 2; i++) {
    const dot = document.getElementById('signupDot' + i);
    dot.className = 'setup-dot';
    if (i < step) dot.classList.add('done');
    if (i === step) dot.classList.add('current');
  }
}

function signupValidateStep1() {
  const name     = document.getElementById('signupName').value.trim();
  const username = document.getElementById('signupUsername').value.trim().toLowerCase();
  const age      = parseInt(document.getElementById('signupAge').value);
  const pass     = document.getElementById('signupPass').value;
  const confirm  = document.getElementById('signupConfirm').value;
  const err      = document.getElementById('signupError');

  if (!name)                          { err.textContent = 'Enter your name.';                         err.style.display = 'block'; return; }
  if (!username)                      { err.textContent = 'Choose a username.';                       err.style.display = 'block'; return; }
  if (!/^[a-z0-9_]+$/.test(username)) { err.textContent = 'Username can only contain letters, numbers, and underscores.'; err.style.display = 'block'; return; }
  if (!age || age < 13 || age > 100)  { err.textContent = 'Enter a valid age (13–100).';              err.style.display = 'block'; return; }
  if (!pass)                          { err.textContent = 'Create a password.';                       err.style.display = 'block'; return; }
  if (pass.length < 6)                { err.textContent = 'Password must be at least 6 characters.'; err.style.display = 'block'; return; }
  if (pass !== confirm)               { err.textContent = 'Passwords don\'t match.';                  err.style.display = 'block'; return; }

  err.style.display = 'none';
  signupGoTo(2);
}

async function handleSignUp() {
  const display_name    = document.getElementById('signupName').value.trim();
  const username        = document.getElementById('signupUsername').value.trim().toLowerCase();
  const age             = parseInt(document.getElementById('signupAge').value);
  const password        = document.getElementById('signupPass').value;
  const gymName         = document.getElementById('signupGymSelect').value;
  const barcodeNumber   = document.getElementById('signupBarcodeNumber').value.trim();
  const err             = document.getElementById('signupError2');

  const createBtn = document.querySelector('#signupStep2 .btn-primary');
  createBtn.textContent = 'Creating...';
  createBtn.disabled = true;

  const user_id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  const { error } = await db.from('users').insert({
    user_id, username, password, display_name, age,
    role: 'member',
    subscription: 'free'
  });

  if (error) {
    createBtn.textContent = 'Create Account';
    createBtn.disabled = false;
    err.textContent = error.code === '23505'
      ? 'That username is already taken. Please choose another.'
      : 'Error creating account: ' + (error.message || 'Please try again.');
    err.style.display = 'block';
    return;
  }

  // Save gym barcode if provided
  if (gymName && barcodeNumber) {
    const gym = SUPPORTED_GYMS.find(g => g.name === gymName);
    await db.from('user_settings').insert({
      user_id,
      gym_name: gymName,
      barcode_number: barcodeNumber,
      barcode_format: gym ? gym.format : 'CODE39',
      setup_complete: true
    });
  }

  // Auto-login after signup
  currentUser = { user_id, username, password, display_name, age, role: 'member', subscription: 'free', created_at: new Date().toISOString() };
  localStorage.setItem('ironlog_session', JSON.stringify(currentUser));
  // Mark setup as done so the wizard doesn't show
  localStorage.setItem('ironlog_setup_done_' + user_id, 'true');

  document.getElementById('signupOverlay').style.display = 'none';
  enterApp();
  showToast('Welcome to IRONLOG! 💪');
}

// ===== LOGIN =====

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
  showLanding();
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

  // Show/hide pro badge
  updateProBadge();

  // Go to dashboard
  showPage('dashboard');

  // Check for Stripe upgrade return
  checkUpgradeReturn();

  // Check if this user needs first-time setup
  checkFirstTimeSetup();
}

// Runs on page load — checks if you were already logged in
async function checkSession() {
  const s = localStorage.getItem('ironlog_session');
  if (s) {
    try {
      currentUser = JSON.parse(s);
      // Re-fetch from DB to pick up any new columns (e.g. subscription)
      // added since the session was cached
      const { data } = await db
        .from('users')
        .select('*')
        .eq('user_id', currentUser.user_id)
        .single();
      if (data) {
        currentUser = data;
        localStorage.setItem('ironlog_session', JSON.stringify(data));
      }
      enterApp();
    } catch (e) {
      localStorage.removeItem('ironlog_session');
    }
  }
}
