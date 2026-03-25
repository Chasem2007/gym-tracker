/*
  =============================================
  account.js — MY ACCOUNT + FIRST-TIME SETUP
  =============================================
*/

// Helper: safely get one row from user_settings
// without using .single() which throws errors
async function getUserSettings() {
  const { data } = await db
    .from('user_settings')
    .select('*')
    .eq('user_id', currentUser.user_id)
    .limit(1);
  return (data && data.length > 0) ? data[0] : null;
}

// Helper: save to user_settings (insert or update)
async function upsertUserSettings(fields) {
  const existing = await getUserSettings();
  if (existing) {
    await db.from('user_settings').update(fields).eq('user_id', currentUser.user_id);
  } else {
    await db.from('user_settings').insert({ user_id: currentUser.user_id, ...fields });
  }
}

// ===== ACCOUNT PAGE =====

async function loadAccountData() {
  if (!currentUser) return;

  document.getElementById('acctDisplayName').value = currentUser.display_name || '';
  document.getElementById('acctUsername').value = currentUser.username || '';

  // Populate gym dropdown
  const select = document.getElementById('acctGymSelect');
  select.innerHTML = '<option value="">— Choose your gym —</option>' +
    SUPPORTED_GYMS.map(g => `<option value="${g.name}">${g.name}</option>`).join('');

  // Load barcode settings
  const settings = await getUserSettings();
  if (settings && settings.barcode_number) {
    select.value = settings.gym_name || '';
    document.getElementById('acctBarcodeNumber').value = settings.barcode_number || '';
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

  if (error) { showToast('Error: ' + (error.message || 'Could not update'), 'error'); return; }

  currentUser.display_name = displayName || username;
  currentUser.username = username;
  localStorage.setItem('ironlog_session', JSON.stringify(currentUser));
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
  if (current !== currentUser.password) { showToast('Current password is incorrect', 'error'); return; }

  const { error } = await db.from('users').update({ password: newPass }).eq('user_id', currentUser.user_id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }

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
  await upsertUserSettings({
    gym_name: gymName,
    barcode_number: barcodeNumber,
    barcode_format: gym ? gym.format : 'CODE39'
  });
  showToast('Barcode saved!');
}

// ===== FIRST-TIME SETUP WIZARD =====

async function checkFirstTimeSetup() {
  if (!currentUser) return;

  // localStorage is the primary gate — fast and reliable
  const localKey = 'ironlog_setup_done_' + currentUser.user_id;
  if (localStorage.getItem(localKey)) return;

  try {
    // If user has any settings row, they've used the app before
    const settings = await getUserSettings();
    if (settings) {
      localStorage.setItem(localKey, 'true');
      return;
    }

    // If user has logged any workouts, not a new user
    const { data: workouts } = await db
      .from('workouts')
      .select('id')
      .eq('user_id', currentUser.user_id)
      .limit(1);
    if (workouts && workouts.length > 0) {
      localStorage.setItem(localKey, 'true');
      return;
    }
  } catch (e) {
    // Any error = skip wizard, don't annoy the user
    localStorage.setItem(localKey, 'true');
    return;
  }

  showSetupWizard();
}

function showSetupWizard() {
  document.getElementById('setupOverlay').style.display = 'flex';
  document.getElementById('setupDisplayName').value = currentUser.display_name || '';

  const select = document.getElementById('setupGymSelect');
  select.innerHTML = '<option value="">— Choose your gym (optional) —</option>' +
    SUPPORTED_GYMS.map(g => `<option value="${g.name}">${g.name}</option>`).join('');

  setupNext(1);
}

function setupNext(step) {
  document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('active'));
  document.getElementById('setupStep' + step).classList.add('active');
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

  if (newPass) {
    if (newPass !== confirmPass) { showToast('Passwords don\'t match', 'error'); setupNext(2); return; }
    if (newPass.length < 6) { showToast('Password must be at least 6 characters', 'error'); setupNext(2); return; }
  }

  // Update user profile
  const updates = {};
  if (displayName) updates.display_name = displayName;
  if (newPass) updates.password = newPass;

  if (Object.keys(updates).length > 0) {
    await db.from('users').update(updates).eq('user_id', currentUser.user_id);
    if (displayName) currentUser.display_name = displayName;
    if (newPass) currentUser.password = newPass;
    localStorage.setItem('ironlog_session', JSON.stringify(currentUser));
    document.getElementById('userName').textContent = currentUser.display_name || currentUser.username;
    document.getElementById('userAvatar').textContent = (currentUser.display_name || currentUser.username).charAt(0).toUpperCase();
  }

  // Save settings
  const settingsData = { setup_complete: true };
  if (gymName && barcodeNumber) {
    const gym = SUPPORTED_GYMS.find(g => g.name === gymName);
    settingsData.gym_name = gymName;
    settingsData.barcode_number = barcodeNumber;
    settingsData.barcode_format = gym ? gym.format : 'CODE39';
  }
  await upsertUserSettings(settingsData);

  // Close wizard and mark done locally
  document.getElementById('setupOverlay').style.display = 'none';
  localStorage.setItem('ironlog_setup_done_' + currentUser.user_id, 'true');
  showToast('Welcome to IRONLOG! 💪');
  loadDashboard();
}
