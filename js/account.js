/*
  =============================================
  account.js — MY ACCOUNT + FIRST-TIME SETUP
  =============================================
  
  Account page: change display name, username,
  password, and manage gym barcode.
  
  First-time setup: when a new user logs in and
  hasn't set up yet (setup_complete !== true),
  they get a 3-step wizard to set their name,
  password, and barcode before using the app.
  =============================================
*/

// ===== ACCOUNT PAGE =====

async function loadAccountData() {
  if (!currentUser) return;

  // Fill in current values
  document.getElementById('acctDisplayName').value = currentUser.display_name || '';
  document.getElementById('acctUsername').value = currentUser.username || '';

  // Populate gym dropdown
  const select = document.getElementById('acctGymSelect');
  select.innerHTML = '<option value="">— Choose your gym —</option>' +
    SUPPORTED_GYMS.map(g => `<option value="${g.name}">${g.name}</option>`).join('');

  // Load barcode settings
  const { data } = await db
    .from('user_settings')
    .select('gym_name, barcode_number, barcode_format')
    .eq('user_id', currentUser.user_id)
    .single();

  if (data && data.barcode_number) {
    select.value = data.gym_name || '';
    document.getElementById('acctBarcodeNumber').value = data.barcode_number || '';
    onAcctGymSelect();
  }

  // Clear password fields
  document.getElementById('acctCurrentPass').value = '';
  document.getElementById('acctNewPass').value = '';
  document.getElementById('acctConfirmPass').value = '';
}

function onAcctGymSelect() {
  const gymName = document.getElementById('acctGymSelect').value;
  const gym = SUPPORTED_GYMS.find(g => g.name === gymName);
  const info = document.getElementById('acctGymFormatInfo');
  if (gym) {
    info.style.display = 'block';
    document.getElementById('acctGymFormatLabel').textContent = gym.format;
  } else {
    info.style.display = 'none';
  }
}

async function saveAccountProfile() {
  const displayName = document.getElementById('acctDisplayName').value.trim();
  const username = document.getElementById('acctUsername').value.trim().toLowerCase();

  if (!username) { showToast('Username is required', 'error'); return; }

  const { error } = await db.from('users')
    .update({ display_name: displayName || username, username })
    .eq('user_id', currentUser.user_id);

  if (error) {
    showToast('Error: ' + (error.message || 'Could not update'), 'error');
    return;
  }

  // Update the local session
  currentUser.display_name = displayName || username;
  currentUser.username = username;
  localStorage.setItem('ironlog_session', JSON.stringify(currentUser));

  // Update sidebar display
  document.getElementById('userName').textContent = currentUser.display_name;
  document.getElementById('userAvatar').textContent = currentUser.display_name.charAt(0).toUpperCase();

  showToast('Profile updated!');
}

async function saveAccountPassword() {
  const current = document.getElementById('acctCurrentPass').value;
  const newPass = document.getElementById('acctNewPass').value;
  const confirm = document.getElementById('acctConfirmPass').value;

  if (!current) { showToast('Enter your current password', 'error'); return; }
  if (!newPass) { showToast('Enter a new password', 'error'); return; }
  if (newPass !== confirm) { showToast('Passwords don\'t match', 'error'); return; }
  if (newPass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

  // Verify current password
  if (current !== currentUser.password) {
    showToast('Current password is incorrect', 'error');
    return;
  }

  const { error } = await db.from('users')
    .update({ password: newPass })
    .eq('user_id', currentUser.user_id);

  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  // Update local session
  currentUser.password = newPass;
  localStorage.setItem('ironlog_session', JSON.stringify(currentUser));

  document.getElementById('acctCurrentPass').value = '';
  document.getElementById('acctNewPass').value = '';
  document.getElementById('acctConfirmPass').value = '';

  showToast('Password updated!');
}

async function saveAccountBarcode() {
  const gymName = document.getElementById('acctGymSelect').value;
  const barcodeNumber = document.getElementById('acctBarcodeNumber').value.trim();

  if (!gymName) { showToast('Select your gym', 'error'); return; }
  if (!barcodeNumber) { showToast('Enter your barcode number', 'error'); return; }

  const gym = SUPPORTED_GYMS.find(g => g.name === gymName);
  const barcodeFormat = gym ? gym.format : 'CODE39';

  const { data: existing } = await db
    .from('user_settings')
    .select('*')
    .eq('user_id', currentUser.user_id)
    .single();

  if (existing) {
    await db.from('user_settings')
      .update({ gym_name: gymName, barcode_number: barcodeNumber, barcode_format: barcodeFormat })
      .eq('user_id', currentUser.user_id);
  } else {
    await db.from('user_settings')
      .insert({ user_id: currentUser.user_id, gym_name: gymName, barcode_number: barcodeNumber, barcode_format: barcodeFormat });
  }

  showToast('Barcode saved!');
}


// ===== FIRST-TIME SETUP WIZARD =====

// Called after login — checks if user needs initial setup.
// Uses BOTH Supabase and localStorage to track completion,
// so even if the DB column is missing it won't keep popping up.
async function checkFirstTimeSetup() {
  if (!currentUser) return;

  // Check localStorage first (instant, no network needed)
  const localKey = 'ironlog_setup_done_' + currentUser.user_id;
  if (localStorage.getItem(localKey) === 'true') return;

  // Then check Supabase
  try {
    const { data, error } = await db
      .from('user_settings')
      .select('setup_complete')
      .eq('user_id', currentUser.user_id)
      .maybeSingle();  // maybeSingle = returns null instead of error if no row

    if (data && data.setup_complete) {
      // Already done — save to localStorage so we don't check again
      localStorage.setItem(localKey, 'true');
      return;
    }

    // If error (like column doesn't exist), don't show wizard — just skip
    if (error) {
      console.warn('Setup check error:', error.message);
      localStorage.setItem(localKey, 'true');
      return;
    }
  } catch (e) {
    // Network error or column missing — skip the wizard
    console.warn('Setup check failed:', e);
    localStorage.setItem(localKey, 'true');
    return;
  }

  // Show the setup wizard
  showSetupWizard();
}

function showSetupWizard() {
  const overlay = document.getElementById('setupOverlay');
  overlay.style.display = 'flex';

  // Pre-fill with current data
  document.getElementById('setupDisplayName').value = currentUser.display_name || '';

  // Populate gym dropdown
  const select = document.getElementById('setupGymSelect');
  select.innerHTML = '<option value="">— Choose your gym (optional) —</option>' +
    SUPPORTED_GYMS.map(g => `<option value="${g.name}">${g.name}</option>`).join('');

  // Show step 1
  setupNext(1);
}

function setupNext(step) {
  // Hide all steps, show the target
  document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('active'));
  document.getElementById('setupStep' + step).classList.add('active');

  // Update progress dots
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById('setupDot' + i);
    dot.className = 'setup-dot';
    if (i < step) dot.classList.add('done');
    if (i === step) dot.classList.add('current');
  }
}

async function completeSetup() {
  const displayName = document.getElementById('setupDisplayName').value.trim();
  const newPass = document.getElementById('setupNewPass').value;
  const confirmPass = document.getElementById('setupConfirmPass').value;
  const gymName = document.getElementById('setupGymSelect').value;
  const barcodeNumber = document.getElementById('setupBarcodeNumber').value.trim();

  // Validate password if they entered one
  if (newPass) {
    if (newPass !== confirmPass) {
      showToast('Passwords don\'t match', 'error');
      setupNext(2);
      return;
    }
    if (newPass.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      setupNext(2);
      return;
    }
  }

  // Update user profile
  const updates = {};
  if (displayName) updates.display_name = displayName;
  if (newPass) updates.password = newPass;

  if (Object.keys(updates).length > 0) {
    await db.from('users')
      .update(updates)
      .eq('user_id', currentUser.user_id);

    // Update local session
    if (displayName) currentUser.display_name = displayName;
    if (newPass) currentUser.password = newPass;
    localStorage.setItem('ironlog_session', JSON.stringify(currentUser));

    // Update sidebar
    document.getElementById('userName').textContent = currentUser.display_name || currentUser.username;
    document.getElementById('userAvatar').textContent = (currentUser.display_name || currentUser.username).charAt(0).toUpperCase();
  }

  // Save barcode + mark setup complete
  const gym = SUPPORTED_GYMS.find(g => g.name === gymName);
  const settingsData = {
    user_id: currentUser.user_id,
    setup_complete: true
  };
  if (gymName && barcodeNumber) {
    settingsData.gym_name = gymName;
    settingsData.barcode_number = barcodeNumber;
    settingsData.barcode_format = gym ? gym.format : 'CODE39';
  }

  const { data: existing } = await db
    .from('user_settings')
    .select('*')
    .eq('user_id', currentUser.user_id)
    .single();

  if (existing) {
    await db.from('user_settings')
      .update(settingsData)
      .eq('user_id', currentUser.user_id);
  } else {
    await db.from('user_settings')
      .insert(settingsData);
  }

  // Close the wizard
  document.getElementById('setupOverlay').style.display = 'none';
  // Mark as done in localStorage too so it never shows again
  localStorage.setItem('ironlog_setup_done_' + currentUser.user_id, 'true');
  showToast('Welcome to IRONLOG! 💪');
  loadDashboard();
}
