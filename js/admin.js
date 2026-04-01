/*
  =============================================
  admin.js — MEMBER MANAGEMENT
  =============================================
  Admin-only page. Add new members, remove them,
  and see everyone's account info. During beta,
  all accounts are free.
  =============================================
*/

async function loadMembers() {
  showLoading('membersList');
  const { data } = await db
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });

  const container = document.getElementById('membersList');

  if (!data || !data.length) {
    container.innerHTML = '<div class="empty-state"><p>No members found.</p></div>';
    return;
  }

  container.innerHTML = data.map(u => {
    const initial = (u.display_name || u.username).charAt(0).toUpperCase();
    const isSelf = u.user_id === currentUser.user_id;
    return `<div class="member-row">
      <div class="member-avatar">${initial}</div>
      <div class="member-info">
        <div class="member-name">${u.display_name || u.username}</div>
        <div class="member-meta">@${u.username} — joined ${new Date(u.created_at).toLocaleDateString()}</div>
      </div>
      <span class="badge ${u.role === 'admin' ? 'badge-admin' : 'badge-member'}">${u.role === 'admin' ? 'Admin' : 'Member'}</span>
      <span class="badge ${u.subscription === 'pro' ? 'badge-pro' : 'badge-free'}">${u.subscription === 'pro' ? 'PRO' : 'FREE'}</span>
      ${!isSelf ? `<button class="btn btn-danger btn-sm" onclick="deleteMember('${u.user_id}','${u.username}')">Remove</button>` : ''}
    </div>`;
  }).join('');
}

// Opens the "Add Member" modal form
function openAddMemberModal() {
  document.getElementById('modalContainer').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-box">
        <div class="modal-title">Add New Member</div>
        <div class="form-group">
          <label>Display Name</label>
          <input type="text" id="newMemberName" class="form-input" placeholder="John Doe">
        </div>
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="newMemberUser" class="form-input" placeholder="johndoe">
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="text" id="newMemberPass" class="form-input" placeholder="Set a password">
        </div>
        <div class="form-group">
          <label>Role</label>
          <select id="newMemberRole" class="form-input">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
          <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveNewMember()">Add Member</button>
        </div>
      </div>
    </div>`;
}

async function saveNewMember() {
  const display_name = document.getElementById('newMemberName').value.trim();
  const username = document.getElementById('newMemberUser').value.trim().toLowerCase();
  const password = document.getElementById('newMemberPass').value;
  const role = document.getElementById('newMemberRole').value;

  if (!username || !password) {
    showToast('Username and password required', 'error');
    return;
  }

  // Generate a unique user_id — this is what ties all their data together,
  // so even if they change their username later, nothing breaks.
  const user_id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  const { error } = await db.from('users').insert({
    user_id, username, password,
    display_name: display_name || username,
    role
  });

  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  closeModal();
  showToast('Member added!');
  loadMembers();
}

async function deleteMember(userId, username) {
  if (!confirm(`Remove @${username}? This won't delete their workout data.`)) return;
  await db.from('users').delete().eq('user_id', userId);
  showToast('Removed');
  loadMembers();
}
