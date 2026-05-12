/* ═══════════════════════════════════════
   KTLVN — Group Voting System  v2.0
   Role-based: Member (vote only) | Admin (full dashboard)
═══════════════════════════════════════ */

// ── CONFIG ─────────────────────────────
const GROUPS = [
  { id: 'bat-hop-nhat-tam', name: 'BÁT HỢP NHẤT TÂM', emoji: '🔥' },
  { id: 'lien-ket-tri-tue', name: 'LIÊN KẾT TRÍ TUỆ', emoji: '🧠' },
  { id: 'vuon-tam-quoc-te', name: 'VƯƠN TẦM QUỐC TẾ', emoji: '🌏' },
  { id: 'khong-tri-hoan',   name: 'KHÔNG TRÌ HOÃN',   emoji: '⚡' },
  { id: 'dai-duong-xanh',   name: 'ĐẠI DƯƠNG XANH',   emoji: '🌊' },
];

const ADMIN_PASSWORD = 'admin123';
const POLL_MS        = 3000;

const KEY = {
  VOTES:   'ktlvn_votes',
  SESSION: 'ktlvn_session',
  UID:     'ktlvn_uid',
  THEME:   'ktlvn_theme',
};

// ── THEME ───────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(KEY.THEME, theme);

  const isLight = theme === 'light';

  // Sync all toggle checkboxes
  ['theme-toggle-member', 'theme-toggle-admin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = isLight;
  });

  // Welcome floating button label
  const lbl = document.getElementById('welcome-theme-label');
  const ico = document.querySelector('#welcome-theme-btn .wt-icon');
  if (lbl) lbl.textContent = isLight ? 'Chế độ tối' : 'Chế độ sáng';
  if (ico) ico.textContent = isLight ? '☀️' : '🌙';

  // Update Chart.js colors for light mode
  if (state.chart) {
    const tickColor = isLight ? '#6d6b8a' : '#8b8aab';
    const gridColor = isLight ? 'rgba(124,58,237,.08)' : 'rgba(255,255,255,.05)';
    state.chart.options.scales.x.ticks.color = tickColor;
    state.chart.options.scales.y.ticks.color = tickColor;
    state.chart.options.scales.x.grid.color  = gridColor;
    state.chart.options.scales.y.grid.color  = gridColor;
    state.chart.options.plugins.tooltip.backgroundColor = isLight ? 'rgba(255,255,255,.97)' : 'rgba(26,24,48,.95)';
    state.chart.options.plugins.tooltip.titleColor = isLight ? '#7c3aed' : '#a78bfa';
    state.chart.options.plugins.tooltip.bodyColor  = isLight ? '#1e1b4b' : '#fffffe';
    state.chart.update();
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ── STATE ──────────────────────────────
const state = {
  role:          null,   // 'member' | 'admin'
  myGroup:       null,
  selectedGroup: null,
  hasVoted:      false,
  chart:         null,
  pollTimer:     null,
};

// ── STORAGE HELPERS ────────────────────
function getUID() {
  let uid = localStorage.getItem(KEY.UID);
  if (!uid) { uid = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(KEY.UID, uid); }
  return uid;
}

let apiVotes = [];

async function fetchVotes() {
  try {
    const res = await fetch('/api/votes');
    if (res.ok) {
      apiVotes = await res.json();
    }
  } catch (e) {
    console.error('Lỗi khi lấy dữ liệu từ server:', e);
  }
}

function getVotes() {
  return apiVotes;
}

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(KEY.SESSION) || 'null'); }
  catch { return null; }
}

function saveSession(d) { sessionStorage.setItem(KEY.SESSION, JSON.stringify(d)); }
function clearSession()  { sessionStorage.removeItem(KEY.SESSION); }

function hasUserVoted(uid) { return getVotes().some(v => v.uid === uid); }

function getMyVoteEntry(uid) { return getVotes().find(v => v.uid === uid) || null; }

function getVoteTally() {
  const t = {}; GROUPS.forEach(g => t[g.id] = 0);
  getVotes().forEach(v => { if (t[v.voted] !== undefined) t[v.voted]++; });
  return t;
}

// ── TOAST ──────────────────────────────
function showToast(msg, type = 'info', ms = 3500) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]||'💬'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.animation = 'toastOut .3s ease forwards'; setTimeout(() => t.remove(), 320); }, ms);
}

// ── MODAL ──────────────────────────────
function showModal(ico, title, text, cb) {
  document.getElementById('modal-ico').textContent   = ico;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-text').textContent  = text;
  document.getElementById('modal-confirm-btn').onclick = () => { closeModal(); cb && cb(); };
  document.getElementById('confirm-modal').classList.remove('hidden');
}
function closeModal() { document.getElementById('confirm-modal').classList.add('hidden'); }

// ── WELCOME FLOW ───────────────────────
function selectRole(role) {
  document.getElementById('step-role').classList.add('hidden');
  if (role === 'member') {
    document.getElementById('step-group').classList.remove('hidden');
    initCombobox();
  } else {
    document.getElementById('step-admin').classList.remove('hidden');
    setTimeout(() => document.getElementById('admin-pwd-input').focus(), 100);
  }
}

function goBack() {
  document.getElementById('step-group').classList.add('hidden');
  document.getElementById('step-admin').classList.add('hidden');
  document.getElementById('step-role').classList.remove('hidden');
  document.getElementById('pwd-error').classList.add('hidden');
  document.getElementById('admin-pwd-input').value = '';
}

function loginAdmin() {
  const pwd = document.getElementById('admin-pwd-input').value;
  const field = document.getElementById('admin-pwd-input');
  const err   = document.getElementById('pwd-error');

  if (pwd === ADMIN_PASSWORD) {
    state.role = 'admin';
    saveSession({ role: 'admin' });
    hideOverlay();
    showAdminApp();
  } else {
    err.classList.remove('hidden');
    field.classList.add('shake');
    field.value = '';
    setTimeout(() => field.classList.remove('shake'), 450);
    setTimeout(() => field.focus(), 50);
  }
}

function hideOverlay() {
  const ov = document.getElementById('welcome-overlay');
  ov.classList.add('hide');
  setTimeout(() => ov.classList.add('hidden'), 360);
}

// ── COMBOBOX ───────────────────────────
let cboxValue = null;

function initCombobox() {
  const display  = document.getElementById('group-combobox');
  const dropdown = document.getElementById('cbox-dropdown');
  const arrow    = document.getElementById('cbox-arrow');
  const search   = document.getElementById('cbox-search');
  const optsCont = document.getElementById('cbox-options');
  const btnStart = document.getElementById('btn-start');
  let open = false;

  renderOpts('');

  display.addEventListener('click', () => {
    open = !open;
    dropdown.classList.toggle('hidden', !open);
    arrow.classList.toggle('open', open);
    display.setAttribute('aria-expanded', open);
    if (open) setTimeout(() => search.focus(), 50);
  });

  search.addEventListener('input', () => renderOpts(search.value));

  document.addEventListener('click', e => {
    if (!document.getElementById('cbox-wrapper').contains(e.target)) close();
  });

  function close() {
    open = false; dropdown.classList.add('hidden');
    arrow.classList.remove('open'); display.setAttribute('aria-expanded', false);
  }

  function renderOpts(q) {
    const qn = (q || '').trim().toLowerCase();
    optsCont.innerHTML = '';
    const filtered = GROUPS.filter(g => g.name.toLowerCase().includes(qn));
    if (!filtered.length) {
      optsCont.innerHTML = '<div class="cbox-option" style="color:var(--text-muted);cursor:default">Không tìm thấy nhóm</div>';
      return;
    }
    filtered.forEach((g, i) => {
      const opt = document.createElement('div');
      opt.className = 'cbox-option';
      opt.setAttribute('role', 'option');
      opt.innerHTML = `<span class="opt-badge">${GROUPS.indexOf(g)+1}</span>${g.emoji} ${g.name}`;
      opt.addEventListener('click', () => {
        cboxValue = g.id;
        document.getElementById('cbox-display-text').textContent = `${g.emoji} ${g.name}`;
        document.getElementById('cbox-display-text').classList.remove('placeholder');
        btnStart.disabled = false;
        close(); search.value = ''; renderOpts('');
      });
      optsCont.appendChild(opt);
    });
  }

  btnStart.addEventListener('click', () => {
    if (!cboxValue) return;
    state.role    = 'member';
    state.myGroup = cboxValue;
    state.hasVoted = hasUserVoted(getUID());
    saveSession({ role: 'member', myGroup: cboxValue });
    hideOverlay();
    showMemberApp();
  });
}

// ── MEMBER APP ─────────────────────────
function showMemberApp() {
  const app = document.getElementById('member-app');
  app.classList.remove('hidden');
  app.style.animation = 'fadeIn .5s ease';

  const g = GROUPS.find(g => g.id === state.myGroup);
  document.getElementById('member-group-display').textContent = g ? `${g.emoji} ${g.name}` : state.myGroup;

  if (state.hasVoted) {
    showThankYou();
  } else {
    renderMemberGrid();
  }
}

function renderMemberGrid() {
  const grid = document.getElementById('member-groups-grid');
  grid.innerHTML = '';

  GROUPS.filter(g => g.id !== state.myGroup).forEach(g => {
    const card = document.createElement('div');
    card.className = 'gcard';
    card.id = `card-${g.id}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Chọn ${g.name}`);
    card.innerHTML = `
      <span class="gcard-check">✓</span>
      <span class="gcard-emoji">${g.emoji}</span>
      <div class="gcard-name">${g.name}</div>
    `;
    card.addEventListener('click', () => selectMemberGroup(g.id, card, g));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectMemberGroup(g.id, card, g); }
    });
    grid.appendChild(card);
  });

  document.getElementById('btn-member-vote').addEventListener('click', submitMemberVote);
}

function selectMemberGroup(gid, cardEl, group) {
  if (state.selectedGroup) {
    document.getElementById(`card-${state.selectedGroup}`)?.classList.remove('selected');
  }
  state.selectedGroup = gid;
  cardEl.classList.add('selected');

  document.getElementById('btn-member-vote').disabled = false;
  document.getElementById('member-vote-hint').textContent = `Đã chọn: ${group.emoji} ${group.name}`;
  spawnHearts(cardEl);
}

async function submitMemberVote() {
  if (!state.selectedGroup || state.hasVoted) return;

  const uid = getUID();
  if (hasUserVoted(uid)) {
    showToast('Bạn đã bình chọn rồi!', 'error');
    state.hasVoted = true;
    showThankYou();
    return;
  }

  if (state.selectedGroup === state.myGroup) {
    showToast('Không thể bình chọn cho chính nhóm của bạn!', 'error');
    return;
  }

  try {
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        voter: state.myGroup,
        voted: state.selectedGroup
      })
    });

    if (res.ok) {
      const data = await res.json();
      apiVotes.push(data.vote); // Update local cache immediately
      state.hasVoted = true;
      saveSession({ role: 'member', myGroup: state.myGroup, voted: state.selectedGroup });
      showThankYou();
    } else {
      const err = await res.json();
      showToast(err.error || 'Lỗi khi gửi phiếu bầu', 'error');
    }
  } catch (e) {
    showToast('Lỗi kết nối đến máy chủ', 'error');
  }
}

function showThankYou() {
  document.getElementById('member-voting').classList.add('hidden');
  document.getElementById('member-thankyou').classList.remove('hidden');

  const uid   = getUID();
  const entry = getMyVoteEntry(uid);
  const card  = document.getElementById('ty-voted-card');

  if (entry) {
    const g = GROUPS.find(x => x.id === entry.voted);
    card.innerHTML = g
      ? `<span style="font-size:28px">${g.emoji}</span><br>${g.name}`
      : entry.voted;
  } else if (state.selectedGroup) {
    const g = GROUPS.find(x => x.id === state.selectedGroup);
    card.innerHTML = g ? `<span style="font-size:28px">${g.emoji}</span><br>${g.name}` : '';
  }
}

// ── ADMIN APP ──────────────────────────
function showAdminApp() {
  const app = document.getElementById('admin-app');
  app.classList.remove('hidden');
  app.style.animation = 'fadeIn .5s ease';
  renderAdminResults();
  renderAdminLog();
  startPolling();
}

function switchAdminTab(tab) {
  document.querySelectorAll('#admin-app .tab-content').forEach(el => {
    el.classList.remove('active'); el.classList.add('hidden');
  });
  document.querySelectorAll('#admin-app .tab-btn').forEach(el => {
    el.classList.remove('active'); el.setAttribute('aria-selected', false);
  });
  document.getElementById(`admin-tab-${tab}`).classList.add('active');
  document.getElementById(`admin-tab-${tab}`).classList.remove('hidden');
  const btn = document.getElementById(`tab-${tab}-btn`);
  btn.classList.add('active'); btn.setAttribute('aria-selected', true);

  if (tab === 'manage') renderAdminLog();
}

function logoutAdmin() {
  clearSession();
  location.reload();
}

// ── ADMIN RESULTS ──────────────────────
function renderAdminResults() {
  const tally  = getVoteTally();
  const total  = Object.values(tally).reduce((a, b) => a + b, 0);
  const sorted = GROUPS.map(g => ({ ...g, votes: tally[g.id] || 0 }))
                       .sort((a, b) => b.votes - a.votes);

  document.getElementById('stat-total').textContent  = total;
  document.getElementById('stat-groups').textContent = GROUPS.length;
  const leader = sorted[0];
  document.getElementById('stat-leader').textContent = leader && leader.votes > 0 ? leader.emoji : '—';

  renderChart(sorted);
  renderPodium(sorted, total);
}

function renderChart(sorted) {
  const ctx = document.getElementById('vote-chart').getContext('2d');
  const labels = sorted.map(g => g.name);
  const data   = sorted.map(g => g.votes);
  const colors = sorted.map((_, i) => ['rgba(251,191,36,.85)','rgba(148,163,184,.8)','rgba(217,119,6,.8)'][i] || 'rgba(124,58,237,.75)');
  const borders = sorted.map((_, i) => ['#fbbf24','#94a3b8','#d97706'][i] || '#7c3aed');

  if (state.chart) {
    state.chart.data.labels = labels;
    state.chart.data.datasets[0].data = data;
    state.chart.data.datasets[0].backgroundColor = colors;
    state.chart.data.datasets[0].borderColor = borders;
    state.chart.update('active');
    return;
  }

  state.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Phiếu bầu', data, backgroundColor: colors, borderColor: borders, borderWidth: 2, borderRadius: 8, borderSkipped: false }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(26,24,48,.95)', borderColor: 'rgba(124,58,237,.5)', borderWidth: 1,
          titleColor: '#a78bfa', bodyColor: '#fffffe', padding: 12,
          callbacks: { label: c => ` ${c.parsed.y} phiếu bầu` }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#8b8aab', font: { family:'Inter', size:11 }, maxRotation: 25 } },
        y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#8b8aab', font: { family:'Inter', size:12 }, stepSize:1, precision:0 }, beginAtZero: true }
      }
    }
  });
}

function renderPodium(sorted, total) {
  const list = document.getElementById('podium-list');
  list.innerHTML = '';
  const medals  = ['🥇','🥈','🥉'];
  const rcls    = ['r1','r2','r3'];

  if (total === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:24px;font-size:14px">📭 Chưa có phiếu bầu nào</div>';
    return;
  }

  sorted.forEach((g, i) => {
    const pct = total > 0 ? Math.round(g.votes / total * 100) : 0;
    const rc  = i < 3 ? rcls[i] : 'p-def';
    const med = i < 3 ? medals[i] : `#${i+1}`;
    const d   = document.createElement('div');
    d.className = `podium-item ${rc}`;
    d.style.animationDelay = `${i*55}ms`;
    d.innerHTML = `
      <div class="p-rank">${med}</div>
      <div class="p-info">
        <div class="p-name">${g.emoji} ${g.name}</div>
        <div class="p-votes-lbl">${pct}% tổng phiếu</div>
      </div>
      <div class="p-bar-wrap">
        <div class="p-bar-bg"><div class="p-bar-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="p-count">${g.votes}</div>
    `;
    list.appendChild(d);
  });
}

// ── ADMIN LOG ──────────────────────────
function renderAdminLog() {
  const votes = getVotes();
  const el    = document.getElementById('vote-log');
  if (!el) return;

  if (!votes.length) {
    el.textContent = 'Chưa có phiếu bầu nào được ghi nhận.';
    return;
  }

  el.innerHTML = votes.map((v, i) => {
    const voter = GROUPS.find(g => g.id === v.voter);
    const voted = GROUPS.find(g => g.id === v.voted);
    const t     = new Date(v.time).toLocaleTimeString('vi-VN');
    return `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,.05)">`
      + `<span style="color:var(--primary-light)">#${i+1}</span> `
      + `${voter ? voter.emoji+' '+voter.name : v.voter} `
      + `→ <span style="color:var(--accent)">${voted ? voted.emoji+' '+voted.name : v.voted}</span> `
      + `<span style="font-size:11px;color:var(--text-muted)">[${t}]</span></div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

// ── ADMIN ACTIONS ──────────────────────
function confirmReset() {
  showModal('⚠️', 'Reset tất cả phiếu bầu?',
    'Toàn bộ dữ liệu bình chọn sẽ bị xóa vĩnh viễn trên Server. Hành động này không thể hoàn tác!',
    async () => {
      try {
        const res = await fetch('/api/votes', { method: 'DELETE' });
        if (res.ok) {
          apiVotes = [];
          renderAdminResults();
          renderAdminLog();
          showToast('🗑️ Đã reset tất cả phiếu bầu!', 'success');
        }
      } catch(e) {
        showToast('Lỗi kết nối máy chủ', 'error');
      }
    }
  );
}

function exportData() {
  const data = { votes: getVotes(), tally: getVoteTally(), exportedAt: new Date().toISOString() };
  const url  = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a    = Object.assign(document.createElement('a'), { href: url, download: `ktlvn_votes_${Date.now()}.json` });
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 Đã xuất dữ liệu!', 'success');
}

// ── POLLING ────────────────────────────
function startPolling() {
  if (state.pollTimer) clearInterval(state.pollTimer);
  
  // Lấy dữ liệu ngay khi vừa bắt đầu
  fetchVotes().then(() => {
    const tab = document.querySelector('#admin-app .tab-content.active');
    if (tab && tab.id === 'admin-tab-result') renderAdminResults();
    if (tab && tab.id === 'admin-tab-manage') renderAdminLog();
  });

  state.pollTimer = setInterval(async () => {
    await fetchVotes();
    const tab = document.querySelector('#admin-app .tab-content.active');
    if (tab && tab.id === 'admin-tab-result') renderAdminResults();
    if (tab && tab.id === 'admin-tab-manage') renderAdminLog();
  }, POLL_MS);
}

// ── FLOATING HEARTS ────────────────────
function spawnHearts(el) {
  const r = el.getBoundingClientRect();
  const EMOJIS = ['❤️','💜','💛','🧡'];
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      const h = document.createElement('div');
      h.className = 'floating-heart';
      h.textContent = EMOJIS[Math.floor(Math.random() * 4)];
      h.style.left = (r.left + r.width * Math.random()) + 'px';
      h.style.top  = (r.top  + r.height * Math.random()) + 'px';
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 1200);
    }, i * 130);
  }
}

// ── INIT ───────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Áp dụng theme đã lưu
  const savedTheme = localStorage.getItem(KEY.THEME) || 'dark';
  applyTheme(savedTheme);

  // Tải dữ liệu từ server trước khi render
  await fetchVotes();

  // Khôi phục session
  const session = getSession();
  if (session) {
    if (session.role === 'admin') {
      state.role = 'admin';
      hideOverlay();
      showAdminApp();
      return;
    }
    if (session.role === 'member' && session.myGroup) {
      state.role    = 'member';
      state.myGroup = session.myGroup;
      state.hasVoted = hasUserVoted(getUID());
      if (session.voted) state.selectedGroup = session.voted;
      hideOverlay();
      showMemberApp();
      return;
    }
  }

  // Enter → đăng nhập admin
  document.getElementById('admin-pwd-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') loginAdmin();
  });
});
