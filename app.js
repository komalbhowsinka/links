/* ══════════════════════════════════════
   PASSWORD — only non-secret config
══════════════════════════════════════ */
const OWNER_PASSWORD = "outlandish_humor";

/* ══════════════════════════════════════
   GITHUB CONFIG — no secrets hardcoded
   token + branch entered at login time
   and stored in sessionStorage only
══════════════════════════════════════ */
const GITHUB_OWNER = "komalbhowsinka";
const GITHUB_REPO  = "links";
const GITHUB_FILE  = "index.html";

function getToken()  { return sessionStorage.getItem('gh_token') || ''; }
function getBranch() { return sessionStorage.getItem('gh_branch') || 'main'; }

// essays declared in index.html as single source of truth.
// localStorage overrides if present.
essays = JSON.parse(localStorage.getItem('oh_essays') || 'null') || essays;

const TAG_PALETTE = [
  {border:'#38bdf844',color:'#38bdf8',bg:'#38bdf811'},
  {border:'#a78bfa44',color:'#a78bfa',bg:'#a78bfa11'},
  {border:'#fbbf2444',color:'#fbbf24',bg:'#fbbf2411'},
  {border:'#34d39944',color:'#34d399',bg:'#34d39911'},
  {border:'#fb923c44',color:'#fb923c',bg:'#fb923c11'},
  {border:'#f4727244',color:'#f47272',bg:'#f4727211'},
  {border:'#60a5fa44',color:'#60a5fa',bg:'#60a5fa11'},
  {border:'#f472b644',color:'#f472b6',bg:'#f472b611'},
  {border:'#4ade8044',color:'#4ade80',bg:'#4ade8011'},
  {border:'#facc1544',color:'#facc15',bg:'#facc1511'},
  {border:'#818cf844',color:'#818cf8',bg:'#818cf811'},
  {border:'#2dd4bf44',color:'#2dd4bf',bg:'#2dd4bf11'},
];
const catColourMap = {};
let paletteIdx = 0;

function getCatStyle(cat) {
  if (!catColourMap[cat]) {
    catColourMap[cat] = TAG_PALETTE[paletteIdx % TAG_PALETTE.length];
    paletteIdx++;
  }
  return catColourMap[cat];
}

function tagHTML(cat) {
  const s = getCatStyle(cat);
  return `<span class="tag" style="border-color:${s.border};color:${s.color};background:${s.bg}">${cat}</span>`;
}

let eCat = 'all';
let isOwner = false;
let nextId = essays.length > 0 ? Math.max(...essays.map(e => e.id)) + 1 : 1;

/* ── PERSISTENCE ── */
function save() {
  localStorage.setItem('oh_essays', JSON.stringify(essays));
}

/* ── AUTH ── */
function openLogin() {
  document.getElementById('loginOverlay').classList.add('show');
  // pre-fill branch if already stored
  document.getElementById('branchInput').value = getBranch();
  document.getElementById('pwInput').focus();
}
function closeLogin() {
  document.getElementById('loginOverlay').classList.remove('show');
  document.getElementById('pwInput').value = '';
  document.getElementById('tokenInput').value = '';
  document.getElementById('loginErr').style.display = 'none';
}
function tryLogin() {
  const pw     = document.getElementById('pwInput').value;
  const token  = document.getElementById('tokenInput').value.trim();
  const branch = document.getElementById('branchInput').value.trim() || 'main';

  if (pw !== OWNER_PASSWORD) {
    document.getElementById('loginErr').textContent = 'incorrect password';
    document.getElementById('loginErr').style.display = 'block';
    document.getElementById('pwInput').value = '';
    document.getElementById('pwInput').focus();
    return;
  }
  if (!token) {
    document.getElementById('loginErr').textContent = 'github token is required';
    document.getElementById('loginErr').style.display = 'block';
    document.getElementById('tokenInput').focus();
    return;
  }

  // store in sessionStorage — cleared when tab closes
  sessionStorage.setItem('gh_token', token);
  sessionStorage.setItem('gh_branch', branch);
  isOwner = true;
  closeLogin();
  applyOwnerMode();
  // Sync any localStorage recs to GitHub in the background
  syncLocalRecs();
}
function logout() {
  isOwner = false;
  sessionStorage.removeItem('gh_token');
  sessionStorage.removeItem('gh_branch');
  applyOwnerMode();
}
function applyOwnerMode() {
  document.getElementById('ownerBar').classList.toggle('show', isOwner);
  if (isOwner) {
    document.getElementById('ownerBranch').textContent = getBranch();
  }
  document.getElementById('essay-add-wrap').style.display = isOwner ? 'block' : 'none';
  renderEssays();
  // If owner is on the recommend tab, load the inbox
  if (isOwner && document.getElementById('tab-recommend').classList.contains('visible')) {
    loadRecInbox();
  }
}

/* ── SYNC LOCAL RECS TO GITHUB ON LOGIN ── */
async function syncLocalRecs() {
  const localRecs = JSON.parse(localStorage.getItem('oh_pending_recs') || '[]');
  if (!localRecs.length) return;
  try {
    const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_REC_FILE}`;
    const headers = { 'Authorization': `token ${getToken()}`, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' };
    const getRes  = await fetch(`${apiBase}?ref=main`, { headers });
    let recs = [];
    let sha  = null;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha  = fileData.sha;
      recs = JSON.parse(decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, '')))));
    }
    // Merge — avoid duplicates
    localRecs.forEach(lr => {
      const isDup = lr.url
        ? recs.find(r => r.url === lr.url)
        : recs.find(r => r.title === lr.title && r.author === lr.author);
      if (!isDup) recs.push(lr);
    });
    const body = {
      message: 'rec: sync local recommendations',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(recs, null, 2)))),
      branch: 'main'
    };
    if (sha) body.sha = sha;
    await fetch(apiBase, { method: 'PUT', headers, body: JSON.stringify(body) });
    localStorage.removeItem('oh_pending_recs');
  } catch (err) {
    console.warn('Could not sync local recs to GitHub', err);
  }
}

/* ── SECRET LOCK TRIGGER ── */
let lockClicks = 0, lockTimer = null;
document.getElementById('lockTrigger').addEventListener('click', () => {
  lockClicks++;
  clearTimeout(lockTimer);
  lockTimer = setTimeout(() => lockClicks = 0, 600);
  if (lockClicks >= 3) { lockClicks = 0; openLogin(); }
});

/* ── TABS ── */
function showTab(tab, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('visible');
  btn.classList.add('active');
  if (tab === 'recommend' && isOwner) loadRecInbox();
}

/* ── ESSAYS ── */
function buildCatFilters() {
  const cats = ['all', ...new Set(essays.map(e => e.category))];
  document.getElementById('catFilters').innerHTML = cats.map(c =>
    `<button class="f-btn${c === eCat ? ' active' : ''}" onclick="filterCat('${c}',this)">${c === 'all' ? 'All' : c}</button>`
  ).join('');
}

function filterCat(cat, btn) {
  eCat = cat;
  document.querySelectorAll('#catFilters .f-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderEssays();
}

function renderEssays() {
  buildCatFilters();
  let list = [...essays];
  if (eCat !== 'all') list = list.filter(e => e.category === eCat);
  document.getElementById('essay-count').textContent = list.length + ' essay' + (list.length !== 1 ? 's' : '');
  list.sort((a, b) => b.id - a.id);

  if (!list.length) {
    document.getElementById('essay-cards').innerHTML = '<div class="empty">nothing here yet</div>';
    return;
  }

  const byYear = {};
  list.forEach(e => {
    const parts = (e.dateLabel || 'Undated').split(' ');
    const month = parts.length === 2 ? parts[0] : 'Undated';
    const year  = parts.length === 2 ? parts[1] : 'Undated';
    if (!byYear[year]) byYear[year] = {};
    if (!byYear[year][month]) byYear[year][month] = [];
    byYear[year][month].push(e);
  });

  const ownerMode = isOwner; // capture for use inside template strings
  let html = '';
  Object.keys(byYear).sort((a, b) => b - a).forEach((year, yi) => {
    const yid = 'y-' + yi;
    html += `
      <div class="group-year">
        <button class="group-year-btn" onclick="toggleGroup('${yid}')">
          <span class="group-chevron" id="chev-${yid}">▸</span>
          <span>${year}</span>
          <span class="group-count">${Object.values(byYear[year]).flat().length} essays</span>
        </button>
        <div class="group-body" id="${yid}" style="display:none">`;

    Object.keys(byYear[year]).forEach((month, mi) => {
      const mid = yid + '-m' + mi;
      html += `
          <div class="group-month">
            <button class="group-month-btn" onclick="toggleGroup('${mid}')">
              <span class="group-chevron" id="chev-${mid}">▸</span>
              <span>${month}</span>
              <span class="group-count">${byYear[year][month].length}</span>
            </button>
            <div class="group-body" id="${mid}" style="display:none">`;

      byYear[year][month].forEach(e => {
        const deleteBtn = ownerMode
          ? `<button class="essay-delete" onclick="deleteEssay(${e.id})" title="delete essay">✕</button>`
          : '';
        const recTag = e.recommended
          ? `<span class="tag tag-recommended">✦ recommended</span>`
          : '';
        html += `
        <div class="essay-wrap" style="position:relative">
          ${deleteBtn}
          <a class="essay-card" href="${e.url}" target="_blank">
            <div class="essay-top">
              <div class="essay-title">${e.title}</div>
              <div class="essay-arrow">↗</div>
            </div>
            <div class="essay-meta">${tagHTML(e.category)}<span class="essay-source">${e.source}</span>${recTag}</div>
            <div class="essay-desc">${e.desc}</div>
          </a>
        </div>`;
      });

      html += `</div></div>`;
    });

    html += `</div></div>`;
  });

  document.getElementById('essay-cards').innerHTML = html;
}

function toggleGroup(id) {
  const body = document.getElementById(id);
  const chev = document.getElementById('chev-' + id);
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  chev.textContent = open ? '▸' : '▾';
}

function toggleForm(id) {
  document.getElementById(id).classList.toggle('open');
}

/* ── DELETE ESSAY ── */
function deleteEssay(id) {
  const essay = essays.find(e => e.id === id);
  if (!essay) return;
  showConfirm(
    `Delete this essay?`,
    `"${essay.title}" will be permanently removed and committed to GitHub.`,
    async () => {
      essays = essays.filter(e => e.id !== id);
      save();
      renderEssays();
      showStatus('⏳ Deleting from GitHub…', false);
      try {
        await commitToGitHub(`remove essay "${essay.title}"`);
        showStatus('✅ Deleted & committed to GitHub! Reloading…', false);
        setTimeout(() => location.reload(), 2500);
      } catch (err) {
        console.error(err);
        showStatus('⚠️ Deleted locally but GitHub commit failed: ' + err.message, true);
      }
    }
  );
}

/* ── CONFIRM MODAL ── */
function showConfirm(title, subtitle, onConfirm) {
  // Remove any existing modal
  const existing = document.getElementById('confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'confirm-modal';
  modal.style.cssText = `
    position:fixed; inset:0; z-index:200;
    background:rgba(247,240,242,0.88); backdrop-filter:blur(8px);
    display:flex; align-items:center; justify-content:center;
  `;
  modal.innerHTML = `
    <div style="
      background:var(--bg2); border:1px solid var(--border3);
      border-radius:var(--radius); padding:2rem; width:100%;
      max-width:340px; box-shadow:0 24px 64px rgba(0,0,0,0.3),0 0 48px var(--teal-glow);
      animation:fadeUp 0.25s ease;
    ">
      <div style="font-family:var(--font-serif);font-size:20px;font-style:italic;color:var(--white);margin-bottom:8px">${title}</div>
      <div style="font-size:12px;color:var(--white4);line-height:1.6;margin-bottom:1.5rem;letter-spacing:0.02em">${subtitle}</div>
      <div style="display:flex;gap:8px">
        <button id="confirm-yes" style="
          flex:1; padding:10px; background:#7a1a1a; color:#f47272;
          border:1px solid #f4727244; border-radius:var(--radius-sm);
          font-family:var(--font-sans); font-size:12px; cursor:pointer;
          transition:all 0.18s; letter-spacing:0.04em;
        ">yes, delete</button>
        <button id="confirm-no" style="
          padding:10px 16px; background:transparent; color:var(--white4);
          border:1px solid var(--border2); border-radius:var(--radius-sm);
          font-family:var(--font-sans); font-size:12px; cursor:pointer;
          transition:background 0.15s;
        ">cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('confirm-yes').onclick = () => {
    modal.remove();
    onConfirm();
  };
  document.getElementById('confirm-no').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

/* ── SAVE ESSAY + COMMIT TO GITHUB ── */
async function saveEssay() {
  const title    = document.getElementById('e-title').value.trim();
  const url      = document.getElementById('e-url').value.trim();
  const source   = document.getElementById('e-source').value.trim();
  const desc     = document.getElementById('e-desc').value.trim();
  const category = document.getElementById('e-cat').value.trim();
  const selMonth = document.getElementById('e-month').value;
  const selYear  = document.getElementById('e-year').value;
  if (!title || !url || !category) { alert('Please fill in title, URL and category.'); return; }

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let dateLabel;
  if (selMonth && selYear) {
    dateLabel = selMonth + ' ' + selYear;
  } else if (selMonth || selYear) {
    alert('Please select both a month and a year, or leave both empty for today.');
    return;
  } else {
    const now = new Date();
    dateLabel = months[now.getMonth()] + ' ' + now.getFullYear();
  }
  essays.unshift({
    id: nextId++,
    title, url,
    source: source || '—',
    category,
    dateLabel,
    desc
  });
  save();

  ['e-title','e-url','e-source','e-desc','e-cat'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('e-month').value = '';
  document.getElementById('e-year').value = '';
  document.getElementById('essay-form').classList.remove('open');
  renderEssays();

  showStatus('⏳ Saving to GitHub…', false);
  try {
    await commitToGitHub(`feat: add essay "${title}"`);
    showStatus('✅ Saved & committed to GitHub! Reloading…', false);
    setTimeout(() => location.reload(), 2500);
  } catch (err) {
    console.error(err);
    showStatus('⚠️ Saved locally but GitHub commit failed: ' + err.message, true);
  }
}

/* ── GITHUB COMMIT ── */
async function commitToGitHub(commitMessage) {
  const token  = getToken();
  const branch = getBranch();
  if (!token) throw new Error('No GitHub token in session — please log out and log in again.');

  const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };

  const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers });
  if (!getRes.ok) throw new Error(`GitHub GET failed: ${getRes.status}`);
  const fileData = await getRes.json();
  const sha = fileData.sha;

  const currentContent = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
  const updatedContent = rebuildIndexHtml(currentContent);

  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      content: btoa(unescape(encodeURIComponent(updatedContent))),
      sha,
      branch
    })
  });
  if (!putRes.ok) {
    const err = await putRes.json();
    throw new Error(err.message || `GitHub PUT failed: ${putRes.status}`);
  }
}

/* ── REBUILD index.html ── */
function rebuildIndexHtml(html) {
  const START_MARKER = '/* ESSAYS_START */';
  const END_MARKER   = '/* ESSAYS_END */';
  const start = html.indexOf(START_MARKER);
  const end   = html.indexOf(END_MARKER) + END_MARKER.length;
  if (start === -1 || end < END_MARKER.length) throw new Error('Could not find essay markers in index.html');
  const serialized = JSON.stringify(essays, null, 2);
  return html.slice(0, start)
    + START_MARKER + '\n  let essays = ' + serialized + ';\n  ' + END_MARKER
    + html.slice(end);
}

/* ── STATUS TOAST ── */
function showStatus(msg, isError) {
  let el = document.getElementById('gh-status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'gh-status';
    el.style.cssText = `
      position:fixed; bottom:2rem; left:50%; transform:translateX(-50%);
      padding:12px 24px; border-radius:10px; font-size:12px; font-family:var(--font-sans);
      letter-spacing:0.04em; z-index:999; max-width:90vw; text-align:center;
      box-shadow:0 8px 32px rgba(0,0,0,0.3); transition:opacity 0.3s;
    `;
    document.body.appendChild(el);
  }
  el.style.background = isError ? '#3e1a1a' : '#1a2e2a';
  el.style.color      = isError ? '#f47272' : '#34d399';
  el.style.border     = isError ? '1px solid #f4727244' : '1px solid #34d39944';
  el.style.opacity    = '1';
  el.textContent      = msg;
  if (!isError) return;
  setTimeout(() => { el.style.opacity = '0'; }, 5000);
}

/* ══════════════════════════════════════
   RECOMMENDATIONS
══════════════════════════════════════ */
const GITHUB_REC_FILE = 'recommendations.json';
let currentRecType = 'essay';

/* ── TYPE SELECTOR ── */
function selectRecType(type) {
  currentRecType = type;
  document.getElementById('rec-essay-fields').style.display = type === 'essay' ? 'block' : 'none';
  document.getElementById('rec-book-fields').style.display  = type === 'book'  ? 'block' : 'none';
  document.getElementById('rec-type-essay').classList.toggle('active', type === 'essay');
  document.getElementById('rec-type-book').classList.toggle('active',  type === 'book');
}

/* ── SUBMIT RECOMMENDATION (public) ── */
async function submitRecommendation() {
  let recData = { type: currentRecType, submittedAt: new Date().toISOString() };

  if (currentRecType === 'essay') {
    const url = document.getElementById('rec-url').value.trim();
    if (!url) { showRecStatus('please paste a URL first', true); return; }
    if (!url.startsWith('http')) { showRecStatus('that doesn\'t look like a valid URL', true); return; }
    recData.url = url;
  } else {
    const title  = document.getElementById('rec-book-title').value.trim();
    const author = document.getElementById('rec-book-author').value.trim();
    if (!title)  { showRecStatus('please enter the book title', true); return; }
    if (!author) { showRecStatus('please enter the author name', true); return; }
    recData.title  = title;
    recData.author = author;
  }

  showRecStatus('⏳ submitting…', false);

  try {
    const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_REC_FILE}`;
    const getRes  = await fetch(`${apiBase}?ref=main`);
    let recs = [];
    let sha  = null;

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha  = fileData.sha;
      recs = JSON.parse(decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, '')))));
    }

    // Duplicate check for essays
    if (currentRecType === 'essay' && recs.find(r => r.url === recData.url)) {
      showRecStatus('this URL has already been recommended — thanks!', false);
      document.getElementById('rec-url').value = '';
      return;
    }

    recs.push(recData);

    const token = getToken();
    if (!token) {
      let localRecs = JSON.parse(localStorage.getItem('oh_pending_recs') || '[]');
      localRecs.push(recData);
      localStorage.setItem('oh_pending_recs', JSON.stringify(localRecs));
      showRecStatus('✅ thanks! recommendation noted.', false);
      clearRecForm();
      return;
    }

    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    };
    const body = {
      message: `rec: add ${currentRecType} recommendation`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(recs, null, 2)))),
      branch: 'main'
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(apiBase, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (!putRes.ok) throw new Error('commit failed');

    showRecStatus('✅ thanks! recommendation received.', false);
    clearRecForm();
  } catch (err) {
    let localRecs = JSON.parse(localStorage.getItem('oh_pending_recs') || '[]');
    localRecs.push(recData);
    localStorage.setItem('oh_pending_recs', JSON.stringify(localRecs));
    showRecStatus('✅ thanks! recommendation noted.', false);
    clearRecForm();
  }
}

function clearRecForm() {
  document.getElementById('rec-url').value = '';
  document.getElementById('rec-book-title').value = '';
  document.getElementById('rec-book-author').value = '';
}

function showRecStatus(msg, isError) {
  const el = document.getElementById('rec-status');
  el.style.display = 'block';
  el.style.color = isError ? '#f47272' : 'var(--teal)';
  el.textContent = msg;
  if (!isError) setTimeout(() => { el.style.display = 'none'; }, 4000);
}

/* ── LOAD INBOX (owner only) ── */
async function loadRecInbox() {
  const inbox = document.getElementById('rec-inbox');
  const list  = document.getElementById('rec-inbox-list');
  const empty = document.getElementById('rec-inbox-empty');
  inbox.style.display = 'block';
  list.innerHTML = '<div class="empty">loading…</div>';

  try {
    const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_REC_FILE}`;
    const headers = { 'Authorization': `token ${getToken()}`, 'Accept': 'application/vnd.github+json' };
    const getRes  = await fetch(`${apiBase}?ref=main`, { headers });

    let recs = [];
    if (getRes.ok) {
      const fileData = await getRes.json();
      recs = JSON.parse(decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, '')))));
    }

    // Also merge any localStorage pending recs
    const localRecs = JSON.parse(localStorage.getItem('oh_pending_recs') || '[]');
    localRecs.forEach(lr => { if (!recs.find(r => r.url === lr.url)) recs.push(lr); });

    if (!recs.length) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    list.innerHTML = recs.map((r, i) => {
      const isBook   = r.type === 'book';
      const label    = isBook ? `📚 ${r.title} · ${r.author}` : `📄 ${r.url}`;
      const openBtn  = !isBook ? `<a href="${r.url}" target="_blank" class="rec-btn rec-btn-open">open ↗</a>` : '';
      const addBtn   = !isBook ? `<button class="rec-btn rec-btn-add" onclick="promoteRec(${i})">+ add to essays</button>` : '';
      return `
      <div class="rec-card" id="rec-${i}">
        <div class="rec-url">${label}</div>
        <div class="rec-meta">${new Date(r.submittedAt).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}</div>
        <div class="rec-actions">
          ${openBtn}
          ${addBtn}
          <button class="rec-btn rec-btn-del" onclick="dismissRec(${i})">dismiss</button>
        </div>
      </div>`;
    }).join('');

    // Store recs in memory for promote/dismiss
    window.__recs = recs;
  } catch (err) {
    list.innerHTML = `<div class="empty">could not load recommendations: ${err.message}</div>`;
  }
}

/* ── PROMOTE REC — inline form in inbox ── */
function promoteRec(idx) {
  const rec = window.__recs[idx];
  if (!rec) return;

  // Remove any existing inline form
  const existing = document.getElementById('rec-inline-form');
  if (existing) existing.remove();

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({length: 6}, (_, i) => currentYear + 2 - i)
    .map(y => `<option value="${y}"${y === currentYear ? ' selected' : ''}>${y}</option>`).join('');
  const monthOptions = months.map(m => `<option value="${m}">${m}</option>`).join('');

  const card = document.getElementById(`rec-${idx}`);
  const form = document.createElement('div');
  form.id = 'rec-inline-form';
  form.style.cssText = `
    border:1px solid var(--border3); border-radius:var(--radius);
    padding:1.25rem; margin-top:10px; background:var(--bg3);
    animation:fadeUp 0.25s ease;
  `;
  form.innerHTML = `
    <div style="font-size:10px;color:var(--teal);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px">Add to essays · will be tagged as recommended</div>
    <div class="form-row"><label class="form-label">Title</label><input class="form-input" id="ri-title" placeholder="essay title"/></div>
    <div class="form-row"><label class="form-label">URL</label><input class="form-input" id="ri-url" value="${rec.url}" readonly style="opacity:0.6"/></div>
    <div class="form-row"><label class="form-label">Source</label><input class="form-input" id="ri-source" placeholder="e.g. Aeon, Psyche"/></div>
    <div class="form-row"><label class="form-label">Description</label><input class="form-input" id="ri-desc" placeholder="why should someone read this?"/></div>
    <div class="form-row"><label class="form-label">Category</label><input class="form-input" id="ri-cat" placeholder="e.g. Philosophy, Ethics"/></div>
    <div class="form-row">
      <label class="form-label">Date <span class="form-optional">(optional)</span></label>
      <div style="display:flex;gap:8px">
        <select class="form-input" id="ri-month" style="flex:1"><option value="">Month</option>${monthOptions}</select>
        <select class="form-input" id="ri-year" style="flex:1"><option value="">Year</option>${yearOptions}</select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-save" onclick="savePromotedRec(${idx})">save as recommended</button>
      <button class="btn-cancel" onclick="document.getElementById('rec-inline-form').remove()">cancel</button>
    </div>
  `;
  card.appendChild(form);
  document.getElementById('ri-title').focus();
}

/* ── SAVE PROMOTED REC ── */
async function savePromotedRec(idx) {
  const rec      = window.__recs[idx];
  const title    = document.getElementById('ri-title').value.trim();
  const url      = document.getElementById('ri-url').value.trim();
  const source   = document.getElementById('ri-source').value.trim();
  const desc     = document.getElementById('ri-desc').value.trim();
  const category = document.getElementById('ri-cat').value.trim();
  const selMonth = document.getElementById('ri-month').value;
  const selYear  = document.getElementById('ri-year').value;

  if (!title || !category) { alert('Please fill in title and category.'); return; }

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let dateLabel;
  if (selMonth && selYear) {
    dateLabel = selMonth + ' ' + selYear;
  } else {
    const now = new Date();
    dateLabel = months[now.getMonth()] + ' ' + now.getFullYear();
  }

  // Add essay with recommended flag
  essays.unshift({
    id: nextId++,
    title, url,
    source: source || '—',
    category,
    dateLabel,
    desc,
    recommended: true
  });
  save();
  renderEssays();

  // Dismiss rec from inbox
  await dismissRec(idx);

  showStatus('⏳ Saving to GitHub…', false);
  try {
    await commitToGitHub(`feat: add recommended essay "${title}"`);
    showStatus('✅ Saved & committed to GitHub! Reloading…', false);
    setTimeout(() => location.reload(), 2500);
  } catch (err) {
    console.error(err);
    showStatus('⚠️ Saved locally but GitHub commit failed: ' + err.message, true);
  }
}

/* ── DISMISS REC ── */
async function dismissRec(idx) {
  const rec = window.__recs[idx];
  if (!rec) return;

  window.__recs.splice(idx, 1);

  // Remove from localStorage
  let localRecs = JSON.parse(localStorage.getItem('oh_pending_recs') || '[]');
  localRecs = localRecs.filter(r => r.url !== rec.url);
  localStorage.setItem('oh_pending_recs', JSON.stringify(localRecs));

  // Commit updated recommendations.json to GitHub
  try {
    const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_REC_FILE}`;
    const headers = { 'Authorization': `token ${getToken()}`, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' };
    const getRes  = await fetch(`${apiBase}?ref=main`, { headers });
    if (getRes.ok) {
      const fileData = await getRes.json();
      await fetch(apiBase, {
        method: 'PUT', headers,
        body: JSON.stringify({
          message: 'rec: dismiss recommendation',
          content: btoa(unescape(encodeURIComponent(JSON.stringify(window.__recs, null, 2)))),
          sha: fileData.sha,
          branch: 'main'
        })
      });
    }
  } catch (err) { console.warn('Could not sync dismiss to GitHub', err); }

  // Re-render inbox
  loadRecInbox();
}

/* ── SHOW INBOX WHEN SWITCHING TO RECOMMEND TAB AS OWNER ── */
function populateYearDropdown() {
  const currentYear = new Date().getFullYear();
  const earliestYear = essays.length > 0
    ? Math.min(...essays.map(e => parseInt((e.dateLabel || '').split(' ')[1]) || currentYear))
    : currentYear;
  const startYear = Math.min(earliestYear, currentYear - 1);
  const endYear   = currentYear + 2;
  const select    = document.getElementById('e-year');
  select.innerHTML = '<option value="">Year</option>';
  for (let y = endYear; y >= startYear; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    select.appendChild(opt);
  }
}

/* ── INIT ── */
populateYearDropdown();
if (getToken()) {
  isOwner = true;
  applyOwnerMode();
} else {
  renderEssays();
}
