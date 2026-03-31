/*
  =============================================
  subscription.js — SUBSCRIPTION & PRO GATING
  =============================================
  Handles free vs. pro tier logic, upgrade flow
  via Stripe Checkout, and the pro badge.
  =============================================
*/

const CHECKOUT_FUNCTION_URL = 'https://ruhdhbjtdywcpjruhzas.supabase.co/functions/v1/create-checkout';

// Returns true if the current user has a Pro subscription
function isPro() {
  return currentUser && currentUser.subscription === 'pro';
}

// Renders an upgrade prompt inside any container element
function showUpgradePrompt(containerId, featureName) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="upgrade-prompt">
      <div class="upgrade-icon">⚡</div>
      <div class="upgrade-title">IRONLOG Pro</div>
      <div class="upgrade-desc">${featureName} is a Pro feature. Upgrade to unlock the full IRONLOG experience.</div>
      <div class="upgrade-features">
        <div class="upgrade-feature-item">🏆 PR Board &amp; Strength Progress Charts</div>
        <div class="upgrade-feature-item">🔥 Workout Heatmap &amp; Consistency Tracking</div>
        <div class="upgrade-feature-item">🍎 Calorie &amp; Macro Tracking</div>
        <div class="upgrade-feature-item">✏️ Edit &amp; Delete Past Workouts</div>
        <div class="upgrade-feature-item">💪 Custom Exercise Creation</div>
        <div class="upgrade-feature-item">🗺️ Interactive Muscle Map</div>
      </div>
      <button class="btn btn-primary upgrade-btn" onclick="startCheckout()">
        Upgrade to Pro — $6.99/mo
      </button>
      <div class="upgrade-note">Cancel anytime. No contracts.</div>
    </div>`;
}

// Initiates Stripe Checkout via the Supabase Edge Function
async function startCheckout() {
  if (!currentUser) return;

  const btns = document.querySelectorAll('.upgrade-btn');
  btns.forEach(b => { b.textContent = 'Loading...'; b.disabled = true; });

  try {
    const appUrl = window.location.origin + window.location.pathname;
    const res = await fetch(CHECKOUT_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.user_id,
        success_url: appUrl + '?upgrade=success',
        cancel_url: appUrl + '?upgrade=cancelled'
      })
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast(data.error || 'Could not start checkout', 'error');
      btns.forEach(b => { b.textContent = 'Upgrade to Pro — $6.99/mo'; b.disabled = false; });
    }
  } catch (e) {
    showToast('Connection error. Please try again.', 'error');
    btns.forEach(b => { b.textContent = 'Upgrade to Pro — $6.99/mo'; b.disabled = false; });
  }
}

// Called on app load — handles redirect back from Stripe Checkout
function checkUpgradeReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('upgrade') === 'success') {
    window.history.replaceState({}, '', window.location.pathname);
    refreshUserSubscription();
  } else if (params.get('upgrade') === 'cancelled') {
    window.history.replaceState({}, '', window.location.pathname);
    showToast('Upgrade cancelled.', 'error');
  }
}

// Fetches the latest subscription status from the database and refreshes UI
async function refreshUserSubscription() {
  if (!currentUser) return;

  const { data } = await db
    .from('users')
    .select('subscription, stripe_customer_id, stripe_subscription_id')
    .eq('user_id', currentUser.user_id)
    .single();

  if (data) {
    currentUser.subscription = data.subscription;
    currentUser.stripe_customer_id = data.stripe_customer_id;
    currentUser.stripe_subscription_id = data.stripe_subscription_id;
    localStorage.setItem('ironlog_session', JSON.stringify(currentUser));

    if (data.subscription === 'pro') {
      showToast('Welcome to IRONLOG Pro!');
      updateProBadge();
      const activePage = document.querySelector('.nav-item.active');
      if (activePage && activePage.dataset.page) {
        showPage(activePage.dataset.page);
      }
    }
  }
}

// Syncs the pro badge visibility in the sidebar
function updateProBadge() {
  const badge = document.getElementById('proBadge');
  if (!badge) return;
  badge.classList.toggle('hidden', !isPro());
}
