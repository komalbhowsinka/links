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
  document.getElementById('branchInput').value = getBranch();
  document.getElementById('pwInput').focus();
}
function closeLogin() {
  document.getElementById('loginOverlay').classList.remove('show');
  document.getElementById('pwInput').value    = '';
  document.getElementById('tokenInput').value = '';
  document.getElementById('loginErr').style.display = 'none';
}
function tryLogin() {
  const pw     = document.getElementById('pwInput').value;
  const token  = document.getElementById('tokenInput').value.trim();
  const branch = document.getElementById('branchInput').value.trim() || 'main';

  if (pw !== OWNER_PASSWORD) {
    showLoginErr('incorrect password');
    document.getElementById('pwInput').value = '';
    document.getElementById('pwInput').focus();
    return;
  }
  if (!token) {
    showLoginErr('github token is required');
    document.getElementById('tokenInput').focus();
    return;
  }

  // Validate token against GitHub before accepting
  showLoginErr('⏳ validating token…', false);
  fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, {
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json' }
  }).then(res => {
    if (res.status === 401) {
      showLoginErr('your GitHub token has expired — generate a new one at github.com/settings/tokens');
      document.getElementById('tokenInput').value = '';
      document.getElementById('tokenInput').focus();
      return;
    }
    if (!res.ok) {
      showLoginErr(`github error ${res.status} — check your token and try again`);
      return;
    }
    sessionStorage.setItem('gh_token',  token);
    sessionStorage.setItem('gh_branch', branch);
    isOwner = true;
    closeLogin();
    applyOwnerMode();
  }).catch(() => {
    showLoginErr('could not reach github — check your connection and try again');
  });
}

function showLoginErr(msg, isError = true) {
  const el = document.getElementById('loginErr');
  el.textContent = msg;
  el.style.display = 'block';
  el.style.color = isError ? '#f47272' : 'var(--teal)';
}

/* ── EYE TOGGLE ── */
function toggleEye(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.style.opacity = isHidden ? '1' : '0.4';
}

function logout() {
  isOwner = false;
  sessionStorage.removeItem('gh_token');
  sessionStorage.removeItem('gh_branch');
  applyOwnerMode();
}
function applyOwnerMode() {
  document.getElementById('ownerBar').classList.toggle('show', isOwner);
  if (isOwner) document.getElementById('ownerBranch').textContent = getBranch();
  document.getElementById('essay-add-wrap').style.display = isOwner ? 'block' : 'none';
  renderEssays();
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

  const ownerMode = isOwner;
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
        <div class="essay-wrap">
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
    'Delete this essay?',
    `"${essay.title}" will be permanently removed and committed to GitHub.`,
    async () => {
      essays = essays.filter(e => e.id !== id);
      save();
      renderEssays();
      showStatus('⏳ Deleting from GitHub…', false);
      try {
        await commitToGitHub(`remove essay "${essay.title}"`);
        showStatus('✅ Deleted & committed to GitHub! Reloading…', false);
        setTimeout(() => { localStorage.removeItem('oh_essays'); location.reload(); }, 2500);
      } catch (err) {
        console.error(err);
        const msg = err.message === 'TOKEN_EXPIRED'
          ? '⚠️ Your GitHub token may have expired — log out and log in with a new token.'
          : '⚠️ Deleted locally but GitHub commit failed: ' + err.message;
        showStatus(msg, true);
      }
    }
  );
}

/* ── CONFIRM MODAL ── */
function showConfirm(title, subtitle, onConfirm) {
  const existing = document.getElementById('confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'confirm-modal';
  modal.style.cssText = `
    position:fixed; inset:0; z-index:200;
    background:rgba(247,240,242,0.88); backdrop-filter:blur(8px);
    display:flex; align-items:center; justify-content:center; padding:1rem;
  `;
  modal.innerHTML = `
    <div style="
      background:var(--bg2); border:1px solid var(--border3);
      border-radius:var(--radius); padding:2rem; width:100%;
      max-width:340px; box-shadow:0 24px 64px rgba(0,0,0,0.3),0 0 48px var(--teal-glow);
      animation:fadeUp 0.25s ease;
    ">
      <div style="font-family:var(--font-serif);font-size:20px;font-style:italic;color:var(--white);margin-bottom:8px">${title}</div>
      <div style="font-size:12px;color:var(--white4);line-height:1.6;margin-bottom:1.5rem">${subtitle}</div>
      <div style="display:flex;gap:8px">
        <button id="confirm-yes" style="
          flex:1; padding:10px; background:#7a1a1a; color:#f47272;
          border:1px solid #f4727244; border-radius:var(--radius-sm);
          font-family:var(--font-sans); font-size:12px; cursor:pointer; letter-spacing:0.04em;
        ">yes, delete</button>
        <button id="confirm-no" style="
          padding:10px 16px; background:transparent; color:var(--white4);
          border:1px solid var(--border2); border-radius:var(--radius-sm);
          font-family:var(--font-sans); font-size:12px; cursor:pointer;
        ">cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById('confirm-yes').onclick = () => { modal.remove(); onConfirm(); };
  document.getElementById('confirm-no').onclick  = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

/* ── SAVE ESSAY ── */
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

  essays.unshift({ id: nextId++, title, url, source: source || '—', category, dateLabel, desc });
  save();

  ['e-title','e-url','e-source','e-desc','e-cat'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('e-month').value = '';
  document.getElementById('e-year').value  = '';
  document.getElementById('essay-form').classList.remove('open');
  renderEssays();

  showStatus('⏳ Saving to GitHub…', false);
  try {
    await commitToGitHub(`feat: add essay "${title}"`);
    showStatus('✅ Saved & committed to GitHub! Reloading…', false);
    setTimeout(() => { localStorage.removeItem('oh_essays'); location.reload(); }, 2500);
  } catch (err) {
    console.error(err);
    const msg = err.message === 'TOKEN_EXPIRED'
      ? '⚠️ Your GitHub token may have expired — log out and log in with a new token.'
      : '⚠️ Saved locally but GitHub commit failed: ' + err.message;
    showStatus(msg, true);
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
  if (getRes.status === 401) throw new Error('TOKEN_EXPIRED');
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
  return html.slice(0, start)
    + START_MARKER + '\n  let essays = ' + JSON.stringify(essays, null, 2) + ';\n  ' + END_MARKER
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
   RECOMMENDATIONS — via Formspree
══════════════════════════════════════ */
const FORMSPREE_URL = 'https://formspree.io/f/mykbeybk';
let currentRecType  = 'essay';

function selectRecType(type) {
  currentRecType = type;
  document.getElementById('rec-essay-fields').style.display = type === 'essay' ? 'block' : 'none';
  document.getElementById('rec-book-fields').style.display  = type === 'book'  ? 'block' : 'none';
  document.getElementById('rec-type-essay').classList.toggle('active', type === 'essay');
  document.getElementById('rec-type-book').classList.toggle('active',  type === 'book');
}

async function submitRecommendation() {
  let payload = { type: currentRecType };

  if (currentRecType === 'essay') {
    const url = document.getElementById('rec-url').value.trim();
    if (!url) { showRecStatus('please paste a URL first', true); return; }
    if (!url.startsWith('http')) { showRecStatus("that doesn't look like a valid URL", true); return; }
    payload.url = url;
  } else {
    const title  = document.getElementById('rec-book-title').value.trim();
    const author = document.getElementById('rec-book-author').value.trim();
    if (!title)  { showRecStatus('please enter the book title', true); return; }
    if (!author) { showRecStatus('please enter the author name', true); return; }
    payload.title  = title;
    payload.author = author;
  }

  showRecStatus('⏳ submitting…', false);

  try {
    const res = await fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Formspree submission failed');
    showRecStatus('✅ thanks! recommendation received.', false);
    clearRecForm();
  } catch (err) {
    showRecStatus('⚠️ something went wrong — please try again.', true);
    console.error(err);
  }
}

function clearRecForm() {
  document.getElementById('rec-url').value         = '';
  document.getElementById('rec-book-title').value  = '';
  document.getElementById('rec-book-author').value = '';
}

function showRecStatus(msg, isError) {
  const el = document.getElementById('rec-status');
  el.style.display = 'block';
  el.style.color   = isError ? '#f47272' : 'var(--teal)';
  el.textContent   = msg;
  if (!isError) setTimeout(() => { el.style.display = 'none'; }, 4000);
}

/* ── POPULATE YEAR DROPDOWN ── */
function populateYearDropdown() {
  const currentYear  = new Date().getFullYear();
  const earliestYear = essays.length > 0
    ? Math.min(...essays.map(e => parseInt((e.dateLabel || '').split(' ')[1]) || currentYear))
    : currentYear;
  const select = document.getElementById('e-year');
  select.innerHTML = '<option value="">Year</option>';
  for (let y = currentYear + 2; y >= Math.min(earliestYear, currentYear - 1); y--) {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
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
