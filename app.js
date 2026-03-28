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
function getBranch() { return sessionStorage.getItem('gh_branch') || 'qa'; }

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
let nextId = Date.now();

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
  const branch = document.getElementById('branchInput').value.trim() || 'qa';

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
        const deleteBtn = isOwner
          ? `<button class="essay-delete" onclick="event.preventDefault();deleteEssay(${e.id})" title="delete essay">✕</button>`
          : '';
        html += `<a class="essay-card" href="${e.url}" target="_blank">
          <div class="essay-top">
            <div class="essay-title">${e.title}</div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              ${deleteBtn}
              <div class="essay-arrow">↗</div>
            </div>
          </div>
          <div class="essay-meta">${tagHTML(e.category)}<span class="essay-source">${e.source}</span></div>
          <div class="essay-desc">${e.desc}</div>
        </a>`;
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
async function deleteEssay(id) {
  const essay = essays.find(e => e.id === id);
  if (!essay) return;
  if (!confirm(`Delete "${essay.title}"?\n\nThis will commit the change to GitHub.`)) return;

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

/* ── SAVE ESSAY + COMMIT TO GITHUB ── */
async function saveEssay() {
  const title    = document.getElementById('e-title').value.trim();
  const url      = document.getElementById('e-url').value.trim();
  const source   = document.getElementById('e-source').value.trim();
  const desc     = document.getElementById('e-desc').value.trim();
  const category = document.getElementById('e-cat').value.trim();
  if (!title || !url || !category) { alert('Please fill in title, URL and category.'); return; }

  const now = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  essays.unshift({
    id: nextId++,
    title, url,
    source: source || '—',
    category,
    dateLabel: months[now.getMonth()] + ' ' + now.getFullYear(),
    desc
  });
  save();

  ['e-title','e-url','e-source','e-desc','e-cat'].forEach(id => document.getElementById(id).value = '');
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

/* ── INIT ── */
renderEssays();
