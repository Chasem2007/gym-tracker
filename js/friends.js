/*
  =============================================
  friends.js — FRIENDS & LEADERBOARD (PRO)
  =============================================
  SQL to run in Supabase:

  CREATE TABLE friendships (
    id uuid primary key default gen_random_uuid(),
    requester_id text references users(user_id) on delete cascade,
    addressee_id text references users(user_id) on delete cascade,
    status text default 'pending' check (status in ('pending','accepted')),
    created_at timestamptz default now(),
    unique(requester_id, addressee_id)
  );
  CREATE INDEX ON friendships(requester_id);
  CREATE INDEX ON friendships(addressee_id);

  ALTER TABLE users ADD COLUMN IF NOT EXISTS searchable boolean DEFAULT true;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
  =============================================
*/

let _friendsActiveTab = 'leaderboard';

async function loadFriends() {
  if (!isPro()) {
    showUpgradePrompt('friends-content', 'Friends & Leaderboard');
    return;
  }
  renderFriendsTabs();
  if (_friendsActiveTab === 'leaderboard') await renderLeaderboard();
  else await renderFriendsList();
}

function renderFriendsTabs() {
  const header = document.getElementById('friends-tabs');
  if (!header) return;
  header.innerHTML = `
    <div class="tabs" style="margin-bottom:20px;">
      <button class="tab-btn${_friendsActiveTab === 'leaderboard' ? ' active' : ''}"
        onclick="switchFriendsTab('leaderboard')">🏆 Leaderboard</button>
      <button class="tab-btn${_friendsActiveTab === 'friends' ? ' active' : ''}"
        onclick="switchFriendsTab('friends')">👥 Friends</button>
    </div>`;
}

async function switchFriendsTab(tab) {
  _friendsActiveTab = tab;
  renderFriendsTabs();
  if (tab === 'leaderboard') await renderLeaderboard();
  else await renderFriendsList();
}

// Returns avatar HTML — img if URL set, else styled initial
function avatarHtml(user, size = 36) {
  const initial = (user.display_name || user.username || '?').charAt(0).toUpperCase();
  if (user.avatar_url) {
    return `<img src="${user.avatar_url}" class="avatar-img" style="width:${size}px;height:${size}px;"
      onerror="this.outerHTML='<div class=\\'avatar-initial\\'style=\\'width:${size}px;height:${size}px;font-size:${Math.round(size*0.4)}px;\\'>${initial}</div>'">`;
  }
  return `<div class="avatar-initial" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.4)}px;">${initial}</div>`;
}

// ===== LEADERBOARD =====

async function renderLeaderboard(metricKey) {
  const container = document.getElementById('friends-body');
  container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  let friendIds = [];
  try {
    const { data: fs } = await db.from('friendships')
      .select('requester_id, addressee_id, status')
      .or(`requester_id.eq.${currentUser.user_id},addressee_id.eq.${currentUser.user_id}`)
      .eq('status', 'accepted');
    (fs || []).forEach(f => {
      const otherId = f.requester_id === currentUser.user_id ? f.addressee_id : f.requester_id;
      friendIds.push(otherId);
    });
  } catch (e) { /* table may not exist yet */ }

  const allIds = [currentUser.user_id, ...friendIds];

  const thirtyAgo = new Date();
  thirtyAgo.setDate(thirtyAgo.getDate() - 30);
  const startStr = thirtyAgo.toISOString().split('T')[0];

  const [{ data: workouts }, { data: userList }] = await Promise.all([
    db.from('workouts').select('user_id, date, exercises').in('user_id', allIds).gte('date', startStr),
    db.from('users').select('user_id, display_name, username, avatar_url').in('user_id', allIds)
  ]);

  const usersMap = {};
  (userList || []).forEach(u => usersMap[u.user_id] = u);

  const exerciseSet = new Set();
  (workouts || []).forEach(w => {
    const exs = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []);
    exs.forEach(ex => { if (ex.name) exerciseSet.add(ex.name); });
  });

  const metric = metricKey || 'consistency';
  const scores = {};
  allIds.forEach(id => scores[id] = 0);

  if (metric === 'consistency') {
    (workouts || []).forEach(w => {
      if (scores[w.user_id] !== undefined) scores[w.user_id]++;
    });
  } else {
    (workouts || []).forEach(w => {
      const exs = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []);
      exs.forEach(ex => {
        if (ex.name !== metric) return;
        (ex.sets || []).forEach(s => {
          const weight = parseFloat(s.weight) || 0;
          const reps = parseInt(s.reps) || 0;
          if (weight > 0 && reps > 0) {
            const e1rm = weight * (1 + reps / 30);
            if (e1rm > (scores[w.user_id] || 0)) scores[w.user_id] = e1rm;
          }
        });
      });
    });
  }

  const ranked = allIds
    .map(id => ({ ...(usersMap[id] || {}), user_id: id, score: scores[id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const metricLabel = metric === 'consistency' ? 'Workouts (30 days)' : `${metric} e1RM`;
  const formatScore = s => metric === 'consistency' ? s : Math.round(s) + ' lbs';
  const exercises = [...exerciseSet].sort();

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
      <span style="font-size:13px;color:var(--text-muted);">Rank by:</span>
      <select class="form-input" style="width:auto;" onchange="renderLeaderboard(this.value)">
        <option value="consistency" ${metric === 'consistency' ? 'selected' : ''}>Consistency</option>
        ${exercises.map(ex => `<option value="${ex}" ${metric === ex ? 'selected' : ''}>${ex} PR</option>`).join('')}
      </select>
    </div>
    <div class="leaderboard-list">
      ${ranked.map((user, i) => {
        const isMe = user.user_id === currentUser.user_id;
        const medals = ['🥇','🥈','🥉'];
        const rank = i < 3 ? medals[i] : `#${i+1}`;
        return `
          <div class="leaderboard-row${isMe ? ' leaderboard-row--me' : ''}">
            <div class="lb-rank">${rank}</div>
            <div style="display:flex;align-items:center;gap:10px;flex:1;">
              ${avatarHtml(user, 38)}
              <div>
                <div class="lb-name">${user.display_name || user.username || 'Unknown'}${isMe ? ' <span style="font-size:11px;color:var(--text-muted);">(you)</span>' : ''}</div>
                <div class="lb-username">@${user.username || '—'}</div>
              </div>
            </div>
            <div class="lb-score">
              <span class="font-display" style="font-size:20px;font-weight:700;color:${isMe ? 'var(--accent)' : 'var(--text-primary)'};">${formatScore(user.score)}</span>
              <div style="font-size:10px;color:var(--text-muted);">${metricLabel}</div>
            </div>
          </div>`;
      }).join('')}
    </div>
    ${ranked.length === 1 ? '<div class="empty-state" style="margin-top:20px;"><p>Add friends to compete on the leaderboard!</p></div>' : ''}`;
}

// ===== FRIENDS MANAGEMENT =====

async function renderFriendsList() {
  const container = document.getElementById('friends-body');
  container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  let allFriendships = [];
  try {
    const { data } = await db.from('friendships')
      .select('*')
      .or(`requester_id.eq.${currentUser.user_id},addressee_id.eq.${currentUser.user_id}`);
    allFriendships = data || [];
  } catch (e) { /* table may not exist */ }

  const accepted = allFriendships.filter(f => f.status === 'accepted');
  const incoming = allFriendships.filter(f => f.status === 'pending' && f.addressee_id === currentUser.user_id);
  const outgoing = allFriendships.filter(f => f.status === 'pending' && f.requester_id === currentUser.user_id);

  const otherIds = [...new Set(allFriendships.map(f =>
    f.requester_id === currentUser.user_id ? f.addressee_id : f.requester_id
  ).filter(Boolean))];

  let usersMap = {};
  if (otherIds.length) {
    const { data: users } = await db.from('users')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', otherIds);
    (users || []).forEach(u => usersMap[u.user_id] = u);
  }

  const friendCard = (f, type) => {
    const otherId = f.requester_id === currentUser.user_id ? f.addressee_id : f.requester_id;
    const user = usersMap[otherId] || {};
    const nameHtml = user.display_name || user.username || 'Unknown';
    const usernameHtml = '@' + (user.username || '—');
    if (type === 'accepted') return `
      <div class="friend-card">
        ${avatarHtml(user, 40)}
        <div class="friend-info">
          <div class="friend-name">${nameHtml}</div>
          <div class="friend-username">${usernameHtml}</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="removeFriend('${f.id}')">Remove</button>
      </div>`;
    if (type === 'incoming') return `
      <div class="friend-card">
        ${avatarHtml(user, 40)}
        <div class="friend-info">
          <div class="friend-name">${nameHtml}</div>
          <div class="friend-username">${usernameHtml}</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-primary btn-sm" onclick="acceptFriend('${f.id}')">Accept</button>
          <button class="btn btn-ghost btn-sm" onclick="declineFriend('${f.id}')">Decline</button>
        </div>
      </div>`;
    if (type === 'outgoing') return `
      <div class="friend-card">
        ${avatarHtml(user, 40)}
        <div class="friend-info">
          <div class="friend-name">${nameHtml}</div>
          <div class="friend-username">${usernameHtml} · <span style="color:var(--yellow);">Pending</span></div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="cancelFriendRequest('${f.id}')">Cancel</button>
      </div>`;
  };

  container.innerHTML = `
    <div class="friends-section">
      <div class="friends-section-title">Find Friends</div>
      <div style="display:flex;gap:8px;">
        <input type="text" id="friendSearchInput" class="form-input" placeholder="Search by username..." style="flex:1;"
          onkeydown="if(event.key==='Enter')searchFriends()">
        <button class="btn btn-primary" onclick="searchFriends()">Search</button>
      </div>
      <div id="friendSearchResults" style="margin-top:10px;"></div>
    </div>

    ${incoming.length ? `
    <div class="friends-section">
      <div class="friends-section-title">Pending Requests (${incoming.length})</div>
      ${incoming.map(f => friendCard(f, 'incoming')).join('')}
    </div>` : ''}

    ${outgoing.length ? `
    <div class="friends-section">
      <div class="friends-section-title">Sent Requests</div>
      ${outgoing.map(f => friendCard(f, 'outgoing')).join('')}
    </div>` : ''}

    <div class="friends-section">
      <div class="friends-section-title">My Friends (${accepted.length})</div>
      ${accepted.length
        ? accepted.map(f => friendCard(f, 'accepted')).join('')
        : '<div class="empty-state" style="padding:20px 0;"><p>No friends yet — search above to add some!</p></div>'}
    </div>`;
}

async function searchFriends() {
  const query = (document.getElementById('friendSearchInput')?.value || '').trim();
  const results = document.getElementById('friendSearchResults');
  if (!query || !results) return;

  results.innerHTML = '<div class="loading-spinner" style="padding:10px 0;"><div class="spinner"></div></div>';

  // Search users who have searchable=true (or null/missing column — handle gracefully)
  const { data: users, error } = await db.from('users')
    .select('user_id, display_name, username, avatar_url, searchable')
    .ilike('username', `%${query}%`)
    .neq('user_id', currentUser.user_id)
    .limit(10);

  if (error) {
    results.innerHTML = '<p style="font-size:13px;color:var(--text-muted);">Search unavailable.</p>';
    return;
  }

  // Filter out users who have explicitly opted out (searchable = false)
  const visible = (users || []).filter(u => u.searchable !== false);

  if (!visible.length) {
    results.innerHTML = '<p style="font-size:13px;color:var(--text-muted);padding:8px 0;">No users found.</p>';
    return;
  }

  // Get existing connections to mark them
  let existingIds = new Set();
  try {
    const { data: existing } = await db.from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${currentUser.user_id},addressee_id.eq.${currentUser.user_id}`);
    (existing || []).forEach(f => {
      existingIds.add(f.requester_id === currentUser.user_id ? f.addressee_id : f.requester_id);
    });
  } catch (e) { /* ignore */ }

  results.innerHTML = visible.map(u => `
    <div class="friend-card" style="margin-bottom:8px;">
      ${avatarHtml(u, 40)}
      <div class="friend-info">
        <div class="friend-name">${u.display_name || u.username}</div>
        <div class="friend-username">@${u.username}</div>
      </div>
      ${existingIds.has(u.user_id)
        ? '<span style="font-size:12px;color:var(--text-muted);">Already connected</span>'
        : `<button class="btn btn-primary btn-sm" onclick="sendFriendRequest('${u.user_id}', this)">Add Friend</button>`}
    </div>`).join('');
}

async function sendFriendRequest(addresseeId, btn) {
  btn.disabled = true; btn.textContent = '...';
  const { error } = await db.from('friendships').insert({
    requester_id: currentUser.user_id,
    addressee_id: addresseeId,
    status: 'pending'
  });
  if (error) { showToast('Could not send request', 'error'); btn.disabled = false; btn.textContent = 'Add Friend'; return; }
  showToast('Friend request sent!');
  btn.textContent = 'Sent ✓'; btn.disabled = true;
}

async function acceptFriend(friendshipId) {
  const { error } = await db.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
  if (error) return showToast('Error accepting request', 'error');
  showToast('Friend added!');
  renderFriendsList();
}

async function declineFriend(friendshipId) {
  await db.from('friendships').delete().eq('id', friendshipId);
  renderFriendsList();
}

async function cancelFriendRequest(friendshipId) {
  await db.from('friendships').delete().eq('id', friendshipId);
  renderFriendsList();
}

async function removeFriend(friendshipId) {
  if (!confirm('Remove this friend?')) return;
  await db.from('friendships').delete().eq('id', friendshipId);
  showToast('Friend removed');
  renderFriendsList();
}
