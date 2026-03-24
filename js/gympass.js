/*
  =============================================
  gympass.js — GYM BARCODE / MEMBERSHIP PASS
  =============================================
  
  SUPPORTED GYMS LIST:
  This is where you add/remove gyms. Each entry
  has a name and the barcode format that gym uses.
  Users can only pick from this list — they can't
  type in a random gym. This keeps the barcode
  format correct so it actually scans.
  
  TO ADD A NEW GYM: Just add a new object to this
  array with the gym's name and barcode format.
  Common formats:
    CODE128 — most common, alphanumeric
    CODE39  — older systems, uppercase + numbers
    EAN13   — 13-digit numeric (retail-style)
    UPC     — 12-digit numeric
    ITF     — numeric pairs (interleaved 2 of 5)
  =============================================
*/

const SUPPORTED_GYMS = [
  { name: 'Locomotion Fitness', format: 'CODE39' },
  // To add more gyms later, just add lines like:
  // { name: 'Planet Fitness', format: 'CODE128' },
  // { name: 'Anytime Fitness', format: 'CODE128' },
];

// Populates the gym dropdown when the page loads
function populateGymDropdown(selectedGym) {
  const select = document.getElementById('gymSelect');
  select.innerHTML = '<option value="">— Choose your gym —</option>' +
    SUPPORTED_GYMS.map(gym =>
      `<option value="${gym.name}" ${gym.name === selectedGym ? 'selected' : ''}>${gym.name}</option>`
    ).join('');
}

// Called when user picks a gym from the dropdown
function onGymSelect() {
  const gymName = document.getElementById('gymSelect').value;
  const gym = SUPPORTED_GYMS.find(g => g.name === gymName);
  const info = document.getElementById('gymFormatInfo');
  
  if (gym) {
    // Show the barcode format so the user knows what's being used
    info.style.display = 'block';
    document.getElementById('gymFormatLabel').textContent = gym.format;
  } else {
    info.style.display = 'none';
  }
}

// Loads saved barcode data when you visit the Gym Pass page
async function loadGymPassData() {
  populateGymDropdown('');

  const { data } = await db
    .from('user_settings')
    .select('gym_name, barcode_number, barcode_format')
    .eq('user_id', currentUser.user_id)
    .single();

  if (data && data.barcode_number) {
    populateGymDropdown(data.gym_name || '');
    document.getElementById('barcodeNumber').value = data.barcode_number || '';
    onGymSelect();  // update format display
    generateBarcodeDisplay(data.barcode_number, data.barcode_format || 'CODE39', data.gym_name);
  }
}

// Generates the visual barcode from a number string
function generateBarcodeDisplay(number, format, gymName) {
  if (!number) return;

  try {
    // Generate the small barcode (shown on the page)
    JsBarcode('#barcodeImage', number, {
      format: format || 'CODE39',
      width: 2,
      height: 80,
      displayValue: true,
      fontSize: 16,
      font: 'DM Sans',
      margin: 10,
      background: '#ffffff',
      lineColor: '#000000'
    });

    // Show the barcode, hide the empty state
    document.getElementById('barcodeDisplay').style.display = 'block';
    document.getElementById('barcodeEmpty').style.display = 'none';
    document.getElementById('fullscreenBtn').style.display = 'inline-flex';

    // Pre-generate the fullscreen version (bigger for easy scanning)
    JsBarcode('#barcodeFullscreen', number, {
      format: format || 'CODE39',
      width: 3,
      height: 120,
      displayValue: true,
      fontSize: 20,
      font: 'DM Sans',
      margin: 20,
      background: '#ffffff',
      lineColor: '#000000'
    });

    document.getElementById('fullscreenGymName').textContent = gymName || '';
  } catch (e) {
    showToast('Invalid barcode: ' + e.message, 'error');
    document.getElementById('barcodeDisplay').style.display = 'none';
    document.getElementById('barcodeEmpty').style.display = 'block';
    document.getElementById('fullscreenBtn').style.display = 'none';
  }
}

// Saves barcode info to Supabase
async function saveBarcode() {
  const gymName = document.getElementById('gymSelect').value;
  const barcodeNumber = document.getElementById('barcodeNumber').value.trim();

  if (!gymName) {
    showToast('Select your gym', 'error');
    return;
  }
  if (!barcodeNumber) {
    showToast('Enter your barcode number', 'error');
    return;
  }

  // Look up the format from the gym list
  const gym = SUPPORTED_GYMS.find(g => g.name === gymName);
  const barcodeFormat = gym ? gym.format : 'CODE39';

  // Upsert into user_settings
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

  generateBarcodeDisplay(barcodeNumber, barcodeFormat, gymName);
  showToast('Barcode saved!');
}

// Toggles fullscreen barcode overlay.
// At the gym, tap "Show Full Screen" and hold
// your phone up to the scanner. Tap to close.
function toggleFullscreenBarcode() {
  const overlay = document.getElementById('fullscreenBarcode');
  if (overlay.style.display === 'none' || overlay.style.display === '') {
    overlay.style.display = 'flex';
  } else {
    overlay.style.display = 'none';
  }
}
