/* ══════════════════════════════════════
   SET YOUR PASSWORD HERE
══════════════════════════════════════ */
const OWNER_PASSWORD = "outlandish_humor";
/* ══════════════════════════════════════ */

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

let essays = JSON.parse(localStorage.getItem('oh_essays') || 'null') || [
  {id:1,  title:"The Case of Empathy",                                              url:"https://aeon.co/essays/a-sophisticates-primer-on-empathy-and-its-limits",                   source:"Aeon",    category:"Psychology",              dateLabel:"Mar 2026", desc:"In a world of difference we can – and should – work harder to cultivate subtle, perceptive empathy towards all human beings."},
  {id:2,  title:"Moral Luck",                                                        url:"https://aeon.co/essays/how-to-tell-a-bad-person-from-a-person-who-did-a-bad-thing",          source:"Aeon",    category:"Ethics",                  dateLabel:"Mar 2026", desc:"Two people drive drunk at night: one kills a pedestrian, one doesn't. Does the unlucky killer deserve more blame or not?"},
  {id:3,  title:"A belief in meritocracy is not only false: it's bad for you",      url:"https://aeon.co/ideas/a-belief-in-meritocracy-is-not-only-false-its-bad-for-you",          source:"Aeon",    category:"Psychology",              dateLabel:"Mar 2026", desc:"Believing in meritocracy makes people more selfish, less self-critical and less likely to support equal opportunity policies."},
  {id:4,  title:"Inside your dreamscape",                                            url:"https://aeon.co/essays/dreams-are-a-precious-resource-dont-let-advertisers-hack-them",      source:"Aeon",    category:"Sleep and Dreams",        dateLabel:"Mar 2026", desc:"Dreams could be used by writers, musicians or anyone else aiming for creative inspiration and exploration."},
  {id:5,  title:"A Brief History of Consumer Culture",                               url:"https://thereader.mitpress.mit.edu/a-brief-history-of-consumer-culture/",                   source:"MITPress",category:"Culture",                 dateLabel:"Mar 2026", desc:"Over the course of the 20th century, capitalism preserved its momentum by molding the ordinary person into a consumer."},
  {id:6,  title:"Happiness doesn't follow Success",                                  url:"https://aeon.co/ideas/happiness-doesnt-follow-success-its-the-other-way-round",             source:"Aeon",    category:"Psychology",              dateLabel:"Mar 2026", desc:"Happiness doesn't follow success: it's the other way round."},
  {id:7,  title:"Beyond The Paleo",                                                  url:"https://aeon.co/essays/morality-evolved-but-it-isnt-fixed",                                 source:"Aeon",    category:"Ethics",                  dateLabel:"Mar 2026", desc:"Our morality may be a product of natural selection, but that doesn't mean it's set in stone."},
  {id:8,  title:"Savage Care",                                                       url:"https://aeon.co/essays/why-bioethics-cannot-help-doctors-in-actual-medical-practice",       source:"Aeon",    category:"Bioethics",               dateLabel:"Mar 2026", desc:"Neat ethical principles have nothing to say to doctors faced with the brutal, bloody compromises of hospital life."},
  {id:9,  title:"The Insurance Catastrophe",                                         url:"https://aeon.co/essays/how-do-we-deal-with-the-catastrophe-of-uninsurability",              source:"Aeon",    category:"Economics",               dateLabel:"Mar 2026", desc:"Whole regions of the world are now uninsurable, bringing radical uncertainty to the economy. How do we fix the problem?"},
  {id:10, title:"Does culture make Emotion",                                         url:"https://aeon.co/essays/who-am-i-when-i-care-emotion-through-the-lens-of-franz-boas",        source:"Aeon",    category:"Anthropology",            dateLabel:"Mar 2026", desc:"Franz Boas helps us solve the puzzle of where our emotional lives originate: in our selves or in the cultures around us."},
  {id:11, title:"There is no good reason to love each other - and that's a relief",  url:"https://psyche.co/ideas/theres-no-good-reason-to-love-each-other-and-thats-a-relief",     source:"Psyche",  category:"Knowledge",               dateLabel:"Mar 2026", desc:"Loving is an unreasonable decision (we are all extremely unpleasant little beasts) and that's what allows it to survive."},
  {id:12, title:"Reversing extinction",                                              url:"https://aeon.co/essays/de-extinction-is-redefining-what-it-means-to-be-alive",              source:"Aeon",    category:"Biology",                 dateLabel:"Mar 2026", desc:"Technologies of preserving and reviving organisms are redefining the meaning of life, death, and extinction itself."},
  {id:13, title:"The Tyranny Of Time",                                               url:"https://www.noemamag.com/the-tyranny-of-time/",                                              source:"Noema",   category:"Philosophy",              dateLabel:"Mar 2026", desc:"The clock is a useful social tool, but it is also deeply political. It benefits some, marginalizes others."},
  {id:14, title:"A duty to oneself",                                                 url:"https://aeon.co/essays/what-african-philosophy-says-about-our-duties-to-oneself",           source:"Aeon",    category:"Ethics",                  dateLabel:"Mar 2026", desc:"African philosophical values of harmony and vitality have much to offer our thinking about what we owe to ourselves."},
  {id:15, title:"There are no psychopaths",                                          url:"https://aeon.co/essays/psychopathy-is-a-zombie-idea-why-does-it-cling-on",                  source:"Aeon",    category:"Psychiatry",              dateLabel:"Mar 2026", desc:"Virtually everything you think you know about psychopathy has been thoroughly debunked. Why does this zombie idea live on?"},
  {id:16, title:"Who is Walter Mignolo?",                                            url:"https://aeon.co/essays/who-is-walter-mignolo-architect-of-decoloniality",                   source:"Aeon",    category:"Political Philosophy",    dateLabel:"Mar 2026", desc:"A prominent architect of decolonial theory, his diagnosis of European colonial ills is both penetrating and flawed."},
  {id:17, title:"IQ scores are falling but, no, we're not growing more stupid",     url:"https://psyche.co/ideas/iq-scores-are-falling-but-no-were-not-growing-more-stupid",        source:"Psyche",  category:"Thinking and Intelligence",dateLabel:"Mar 2026", desc:"Intuitively, the argument that digital media is dumbing us down is plausible."},
  {id:18, title:"Abandoning ourselves",                                              url:"https://aeon.co/essays/why-do-some-regrets-fade-while-others-persist-and-grow",             source:"Aeon",    category:"Values and Beliefs",      dateLabel:"Mar 2026", desc:"Since living requires choosing, we will always feel regret about the paths not taken. But what matters is the future we forge."},
  {id:19, title:"The presence of power",                                             url:"https://aeon.co/essays/rammohun-roy-on-why-government-must-have-an-ethical-presence",      source:"Aeon",    category:"Politics",                dateLabel:"Mar 2026", desc:"The Indian thinker Rammohun Roy believed that good governance must be close: distance made the British Empire cruel."},
  {id:20, title:"The joy of sulk",                                                   url:"https://aeon.co/essays/sulking-is-a-fascinating-form-of-indirect-communication",            source:"Aeon",    category:"Philosophy",              dateLabel:"Mar 2026", desc:"Full of implicit rules and paradoxes, sulking is a marvellous example of intense communication without clear declaration."},
  {id:21, title:"Unbounded",                                                         url:"https://aeon.co/essays/she-freed-physics-but-emmy-noether-couldnt-escape-herself",          source:"Aeon",    category:"History",                 dateLabel:"Mar 2026", desc:"In the early 20th century, Emmy Noether's mathematics transcended the physical world. She longed to do the same herself."},
  {id:22, title:"The greatest use of life",                                          url:"https://aeon.co/essays/is-life-worth-living-the-pragmatic-maybe-of-william-james",          source:"Aeon",    category:"Thinkers",                dateLabel:"Mar 2026", desc:"The pragmatist philosopher William James had a crisp and consistent response when asked if life was worth living: maybe."},
  {id:23, title:"How selfish are we?",                                               url:"https://aeon.co/essays/we-cooperate-to-survive-but-if-no-ones-looking-we-compete",          source:"Aeon",    category:"Anthropology",            dateLabel:"Mar 2026", desc:"An age-old debate about human nature is being energised with new findings on the tightrope of cooperation and competition."},
  {id:24, title:"Sleep is delicious",                                                url:"https://aeon.co/essays/sleep-is-not-just-a-physical-need-but-a-delicious-pleasure",        source:"Aeon",    category:"Sleep and Dreams",        dateLabel:"Mar 2026", desc:"The idea that we should reduce sleep to an efficient minimum in our lives gets something fundamentally wrong."},
  {id:25, title:"Philosopher of pride",                                              url:"https://aeon.co/essays/the-hidden-role-of-pride-and-shame-in-the-human-hive",               source:"Aeon",    category:"Economic History",        dateLabel:"Mar 2026", desc:"For Mandeville, humankind has a bottomless need to be liked: it is this perennial craving that forms the foundation of society."},
  {id:26, title:"Geist in the machine",                                              url:"https://aeon.co/essays/if-we-hope-to-build-artificial-souls-where-should-we-start",        source:"Aeon",    category:"Neuroscience",            dateLabel:"Mar 2026", desc:"As the 18th-century war between mechanism and romanticism returns, we face a new question: can we build artificial souls?"},
  {id:27, title:"You can use music to escape your negative thought loops",           url:"https://psyche.co/ideas/you-can-use-music-to-escape-your-negative-thought-loops",          source:"Psyche",  category:"Neuroscience",            dateLabel:"Mar 2026", desc:"Research is uncovering the way music can calm the brain and there are techniques to help you amplify its emotional power"},
  {id:28, title:"Kind of confusing",                                                 url:"https://aeon.co/essays/how-jazz-and-dolphins-can-help-explain-consciousness",               source:"Aeon",    category:"Philosophy",            dateLabel:"Mar 2026", desc:"Is consciousness like jazz, something hard to pin down? Or is it more like the biology of dolphins, odd but natural?"}
];

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
  document.getElementById('pwInput').focus();
}
function closeLogin() {
  document.getElementById('loginOverlay').classList.remove('show');
  document.getElementById('pwInput').value = '';
  document.getElementById('loginErr').style.display = 'none';
}
function tryLogin() {
  if (document.getElementById('pwInput').value === OWNER_PASSWORD) {
    isOwner = true;
    closeLogin();
    applyOwnerMode();
  } else {
    document.getElementById('loginErr').style.display = 'block';
    document.getElementById('pwInput').value = '';
    document.getElementById('pwInput').focus();
  }
}
function logout() {
  isOwner = false;
  applyOwnerMode();
}
function applyOwnerMode() {
  document.getElementById('ownerBar').classList.toggle('show', isOwner);
  document.getElementById('essay-add-wrap').style.display = isOwner ? 'block' : 'none';
}

/* ── SECRET LOCK TRIGGER ── */
let lockClicks = 0, lockTimer = null;
document.getElementById('lockTrigger').addEventListener('click', () => {
  lockClicks++;
  clearTimeout(lockTimer);
  lockTimer = setTimeout(() => lockClicks = 0, 600);
  if (lockClicks >= 3) {
    lockClicks = 0;
    openLogin();
  }
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

  // Group by year then month
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
        html += `<a class="essay-card" href="${e.url}" target="_blank">
          <div class="essay-top"><div class="essay-title">${e.title}</div><div class="essay-arrow">↗</div></div>
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

function saveEssay() {
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
}

/* ── INIT ── */
renderEssays();
