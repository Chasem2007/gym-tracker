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

  // Avatar
  const avatarPreview = document.getElementById('acctAvatarPreview');
  if (avatarPreview) {
    updateAvatarPreview(currentUser.avatar_url);
  }
  if (document.getElementById('acctAvatarUrl')) {
    document.getElementById('acctAvatarUrl').value = currentUser.avatar_url || '';
  }

  // Searchable toggle
  const searchableToggle = document.getElementById('acctSearchable');
  if (searchableToggle) {
    searchableToggle.checked = currentUser.searchable !== false;
  }

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

  // Render subscription status
  renderSubscriptionStatus();

  // Clear password fields
  document.getElementById('acctCurrentPass').value = '';
  document.getElementById('acctNewPass').value = '';
  document.getElementById('acctConfirmPass').value = '';
}

function updateAvatarPreview(url) {
  const preview = document.getElementById('acctAvatarPreview');
  if (!preview) return;
  const initial = (currentUser.display_name || currentUser.username || '?').charAt(0).toUpperCase();
  const imgHtml = url
    ? `<img src="${url}" class="avatar-upload-img" onerror="this.style.display='none';this.nextSibling.style.display='flex'">
       <div class="avatar-initial" style="width:80px;height:80px;font-size:30px;display:none;">${initial}</div>`
    : `<div class="avatar-initial" style="width:80px;height:80px;font-size:30px;">${initial}</div>`;
  preview.innerHTML = `
    <div class="avatar-upload-wrap" onclick="document.getElementById('avatarFileInput').click()" title="Change photo">
      ${imgHtml}
      <div class="avatar-upload-overlay">📷</div>
    </div>
    <input type="file" id="avatarFileInput" accept="image/*" style="display:none;" onchange="handleAvatarFileChange(this)">`;
}

async function handleAvatarFileChange(input) {
  const file = input.files[0];
  if (!file) return;

  // Show local preview immediately
  const reader = new FileReader();
  reader.onload = e => {
    const wrap = document.querySelector('.avatar-upload-wrap');
    if (wrap) {
      const img = wrap.querySelector('img') || document.createElement('img');
      img.src = e.target.result;
      img.className = 'avatar-upload-img';
    }
  };
  reader.readAsDataURL(file);

  // Upload to Supabase Storage
  showToast('Uploading photo...');
  try {
    const ext = file.name.split('.').pop().toLowerCase() || 'jpg';
    const path = `${currentUser.user_id}.${ext}`;

    const { error: upErr } = await db.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) throw upErr;

    const { data: { publicUrl } } = db.storage.from('avatars').getPublicUrl(path);

    // Save URL to users table
    await db.from('users').update({ avatar_url: publicUrl }).eq('user_id', currentUser.user_id);
    currentUser.avatar_url = publicUrl;
    localStorage.setItem('ironlog_session', JSON.stringify(currentUser));
    updateSidebarAvatar();
    if (document.getElementById('acctAvatarUrl')) {
      document.getElementById('acctAvatarUrl').value = publicUrl;
    }
    showToast('Profile photo updated!');
  } catch (e) {
    showToast('Upload failed — check Supabase Storage setup', 'error');
    console.error('Avatar upload error:', e);
  }
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
  const avatarUrl = document.getElementById('acctAvatarUrl')?.value.trim() || null;
  const searchable = document.getElementById('acctSearchable')?.checked !== false;

  if (!username) { showToast('Username is required', 'error'); return; }

  const updates = {
    display_name: displayName || username,
    username,
    searchable,
    avatar_url: avatarUrl || null
  };

  const { error } = await db.from('users').update(updates).eq('user_id', currentUser.user_id);
  if (error) { showToast('Error: ' + (error.message || 'Could not update'), 'error'); return; }

  Object.assign(currentUser, updates);
  localStorage.setItem('ironlog_session', JSON.stringify(currentUser));

  // Update sidebar
  document.getElementById('userName').textContent = currentUser.display_name;
  updateSidebarAvatar();
  updateAvatarPreview(avatarUrl);
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

// ===== SUBSCRIPTION STATUS =====

function renderSubscriptionStatus() {
  const el = document.getElementById('subscriptionStatus');
  if (!el) return;

  if (isPro()) {
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding:16px;background:var(--bg-input);border:1px solid var(--accent);border-radius:var(--radius-sm);">
        <div style="font-size:28px;">⚡</div>
        <div style="flex:1;">
          <div style="font-weight:700;color:var(--accent);font-family:var(--font-display);letter-spacing:1px;">IRONLOG PRO</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">You have full access to all features</div>
        </div>
        <span class="pro-badge" style="font-size:11px;">PRO</span>
      </div>`;
  } else {
    el.innerHTML = `
      <div style="padding:16px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);">
        <div style="font-weight:600;color:var(--text-primary);margin-bottom:4px;">Free Plan</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">Upgrade to Pro to unlock analytics, calorie tracking, workout editing, and more.</div>
        <button class="btn btn-primary" onclick="startCheckout()" style="width:100%;justify-content:center;">
          ⚡ Upgrade to Pro — $6.99/mo
        </button>
        <div style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:8px;">Cancel anytime. No contracts.</div>
      </div>`;
  }
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
