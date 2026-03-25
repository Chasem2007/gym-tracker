/*
  =============================================
  gympass.js — GYM PASS (display only)
  =============================================
  Shows your saved barcode. To edit, go to
  My Account page. This page is just for
  displaying and scanning at the gym.
  =============================================
*/

const SUPPORTED_GYMS = [
  { name: 'Locomotion Fitness', format: 'CODE39' },
  // Add more gyms here:
  // { name: 'Planet Fitness', format: 'CODE128' },
];

async function loadGymPassData() {
  const { data } = await db
    .from('user_settings')
    .select('gym_name, barcode_number, barcode_format')
    .eq('user_id', currentUser.user_id)
    .maybeSingle();

  if (data && data.barcode_number) {
    generateBarcodeDisplay(data.barcode_number, data.barcode_format || 'CODE39', data.gym_name);
  } else {
    document.getElementById('barcodeDisplay').style.display = 'none';
    document.getElementById('barcodeEmpty').style.display = 'block';
    document.getElementById('fullscreenBtn').style.display = 'none';
  }
}

function generateBarcodeDisplay(number, format, gymName) {
  if (!number) return;
  try {
    JsBarcode('#barcodeImage', number, {
      format: format || 'CODE39',
      width: 2, height: 80, displayValue: true,
      fontSize: 16, font: 'DM Sans', margin: 10,
      background: '#ffffff', lineColor: '#000000'
    });
    document.getElementById('barcodeDisplay').style.display = 'block';
    document.getElementById('barcodeEmpty').style.display = 'none';
    document.getElementById('fullscreenBtn').style.display = 'inline-flex';
    document.getElementById('barcodeGymLabel').textContent = gymName || '';

    JsBarcode('#barcodeFullscreen', number, {
      format: format || 'CODE39',
      width: 3, height: 120, displayValue: true,
      fontSize: 20, font: 'DM Sans', margin: 20,
      background: '#ffffff', lineColor: '#000000'
    });
    document.getElementById('fullscreenGymName').textContent = gymName || '';
  } catch (e) {
    showToast('Barcode error: ' + e.message, 'error');
    document.getElementById('barcodeDisplay').style.display = 'none';
    document.getElementById('barcodeEmpty').style.display = 'block';
    document.getElementById('fullscreenBtn').style.display = 'none';
  }
}

function toggleFullscreenBarcode() {
  const overlay = document.getElementById('fullscreenBarcode');
  if (overlay.style.display === 'none' || overlay.style.display === '') {
    overlay.style.display = 'flex';
  } else {
    overlay.style.display = 'none';
  }
}
