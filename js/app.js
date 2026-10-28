// Güzin'in odası: buzdolabı listesi, kalpler, akşam dekorasyonu, Deniz'den mektuplar.

import { createStore, INC, DEL } from './store.js';
import { ITEMS, WALLS, FLOORS, SHOP, ENVELOPE, STAGE, defaultState, clampPos, spawnPos, thumbSVG, swatchSVG } from './catalog.js';
import { roomSVG } from './room.js';
import { setupServiceWorker } from './sw-update.js';
import {
  dayKey, uid, now, POSTIT_COLORS, fridgeList, unlockInfo, visibleNotes, unreadNotes,
  esc, fmtDate, tilt, normalize, hourAt, dndActive, fmtDur, skyPhase,
  timerState, timerRemaining, mmss, hm, dayLabel, studySessions, studyTotals, BONUS, BONUS_MIN,
} from './logic.js';

const $ = s => document.querySelector(s);
const appEl = $('#app');
const svg = $('#room');

let store = null;
let S = null;
let user = null;
const ui = {
  design: false, sel: null, tab: 'shop', sheet: null, letter: null, fresh: false,
  drag: null, pending: false, color: POSTIT_COLORS[0], delArm: null, delT: null,
  lastMin: '', lastHearts: null, pruned: false, swingUntil: 0,
  ptr: null, rub: 0, lastRub: 0, timerFired: null, timerTxt: '', logArm: null, logT: null,
};

const act = ops => store.apply(ops);

// Sayaç ön ayarları: [dakika, tür]. "Mola" başlatınca kapıya tabela asılmaz.
const PRESETS = [[25, 'Odak'], [50, 'Odak'], [10, 'Mola'], [5, 'Mola']];

init();

async function init() {
  setupStatic();
  try {
    store = await createStore();
  } catch (e) {
    console.error(e);
    $('#loading p').textContent = 'Bağlantı kurulamadı. İnternetini kontrol edip sayfayı yenile ♡';
    return;
  }
  if (store.mode === 'local') $('#localNote').hidden = false;
  store.start({ seed: defaultState, onUser, onState, onError });
  setInterval(() => tick(false), 15000);
  setInterval(timerTick, 250);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(true); });
  setupServiceWorker();
}

/* ---------- Veri olayları ---------- */

function onUser(u) {
  user = u;
  if (store.mode !== 'cloud') return;
  $('#denied').hidden = true;
  if (!u) {
    S = null;
    $('#loading').hidden = true;
    $('#login').hidden = false;
  } else {
    $('#login').hidden = true;
    $('#loading').hidden = !!S;
  }
}

function onState(st) {
  S = normalize(st);
  $('#loading').hidden = true;
  $('#denied').hidden = true;
  if (!ui.pruned) { ui.pruned = true; prune(); }
  render();
}

function onError(e) {
  console.error(e);
  if (e && e.code === 'permission-denied') {
    $('#loading').hidden = true;
    $('#deniedMsg').textContent = `Bu oda sadece Güzin ve Deniz için ♡ (${user?.email || 'bu hesap'} ile girdin)`;
    $('#denied').hidden = false;
  } else if (e && String(e.code || '').startsWith('auth/')) {
    $('#loginErr').textContent = 'Giriş olmadı, tekrar dener misin? (' + e.code + ')';
  }
}

// İki haftadan eski bitmiş notları ve yarım yıldan eski çalışma kayıtlarını temizle; belge küçük kalsın.
// Unutulup süresi dolmuş "Do not disturb" tabelası da kaldırılır (çalışma sayılmaz).
function prune() {
  const lim = Date.now() - 14 * 864e5;
  const ops = Object.entries(S.todos)
    .filter(([, t]) => !t.repeat && t.done && (t.doneAt || 0) < lim)
    .map(([id]) => [`todos.${id}`, DEL]);
  const logLim = Date.now() - 183 * 864e5;
  for (const [id, e] of Object.entries(S.studyLog)) if ((e.start || 0) < logLim) ops.push([`studyLog.${id}`, DEL]);
  if (S.dnd && !dndActive(S)) ops.push(['dnd', DEL]);
  if (ops.length) act(ops);
}

function tick(force) {
  if (!S) return;
  const d = now();
  const k = `${d.getHours()}:${d.getMinutes()}`;
  if (!force && k === ui.lastMin) return;
  ui.lastMin = k;
  render();
}

/* ---------- Çizim ---------- */

function render() {
  if (!S) return;
  if (ui.drag) { ui.pending = true; return; }
  if (ui.sel && !S.placed[ui.sel]) ui.sel = null;
  renderTop();
  renderRoom();
  renderToday();
  renderDock();
  if (ui.design) renderDrawer();
  renderSheet();
  // Alt kart ve düğmeler odanın boyunu değiştirebilir; köşe düğmelerini en son yerleştir.
  placeRoomCtrls();
}

function renderTop() {
  const txt = `♡ ${S.hearts}`;
  const hb = $('#heartsBtn');
  if (hb.textContent !== txt) {
    hb.textContent = txt;
    if (ui.lastHearts !== null && S.hearts > ui.lastHearts) pulse(hb);
  }
  ui.lastHearts = S.hearts;
  $('#drHearts').textContent = txt;
  const n = unreadNotes(S).length;
  const b = $('#mailBadge');
  b.hidden = !n;
  b.textContent = n;
}

function renderRoom() {
  const d = now();
  const { open } = fridgeList(S, dayKey(d));
  syncCats();
  svg.innerHTML = roomSVG(S, {
    now: d, design: ui.design, selected: ui.design ? ui.sel : null,
    postits: open.map(t => t.color), unread: unreadNotes(S).length,
    dnd: dndActive(S), swing: Date.now() < ui.swingUntil, overrides: catOverrides(),
  });
  placeSelBar();
  placeRoomCtrls();
}

// Perde ve ışık düğmeleri odanın sol üst köşesinde dursun.
function placeRoomCtrls() {
  const box = $('#roomCtrls');
  box.hidden = ui.design;
  if (ui.design) return;
  const m = svg.getScreenCTM();
  const wr = $('#stageWrap').getBoundingClientRect();
  if (!m) return;
  box.style.left = (m.e - wr.left + 22 * m.a) + 'px';
  box.style.top = (m.f - wr.top + 22 * m.d) + 'px';
  const c = $('#curtainBtn'), l = $('#lightBtn');
  c.classList.toggle('on', !!S.curtain);
  c.setAttribute('aria-pressed', S.curtain ? 'true' : 'false');
  c.title = S.curtain ? 'Perdeyi aç' : 'Perdeyi kapat';
  l.classList.toggle('on', !!S.light);
  l.setAttribute('aria-pressed', S.light ? 'true' : 'false');
  l.title = S.light ? 'Işığı kapat' : 'Işığı aç';
}

function statusLine(u) {
  if (u.unlocked) return u.gift && !(u.listOk && u.timeOk) ? '🎁 Deniz bugün dekorasyonu senin için açtı ♡' : '✨ Dekorasyon açık! Odanı süsleyebilirsin';
  if (u.listOk && !u.doneToday.length) return `🌙 Dekorasyon ${hourAt(u.hour)} açılıyor`;
  if (u.listOk) return `🌙 Liste bitti! Dekorasyon ${hourAt(u.hour)} açılıyor`;
  if (u.timeOk) return `🔒 Dekorasyon için ${u.open.length} not kaldı`;
  return `🔒 Dekorasyon: liste bitince ve saat ${u.hour}:00 olunca`;
}

function renderToday() {
  const u = unlockInfo(S, now());
  const total = u.open.length + u.doneToday.length;
  const done = u.doneToday.length;
  const unread = unreadNotes(S).length;
  const minis = u.open.slice(0, 4).map(t => `<span class="mini" style="--c:${esc(t.color || POSTIT_COLORS[0])};--r:${tilt(t.id)}deg">${esc(t.text)}</span>`).join('')
    + (u.open.length > 4 ? `<span class="mini more">+${u.open.length - 4} not</span>` : '');
  $('#today').innerHTML = `
    <div class="tl"><span>Bugün ♡ ${total ? `${done}/${total} not bitti` : 'buzdolabına not ekle'}</span><span class="mut small">her not +1 ♡</span></div>
    ${total ? `<div class="bar"><i style="width:${Math.round(done / total * 100)}%"></i></div>` : ''}
    ${minis ? `<div class="minis">${minis}</div>` : ''}
    <div class="st">${statusLine(u)}</div>
    ${dndActive(S) ? `<div class="st">📚 Kapıda "Do not disturb" asılı · ${dndLabel()}</div>` : ''}
    ${unread ? '<div class="mailnote">💌 Kapının önünde bir zarf var!</div>' : ''}`;
}

function renderDock() {
  const u = unlockInfo(S, now());
  const c = $('#fridgeCnt');
  c.hidden = !u.open.length;
  c.textContent = u.open.length;
  const b = $('#decorBtn');
  b.textContent = u.unlocked ? '🎨 Dekorasyon' : '🔒 Dekorasyon';
  b.classList.toggle('primary', u.unlocked);
  b.classList.toggle('locked', !u.unlocked);
}

/* ---------- Alt sayfalar ---------- */

function openSheet(name) {
  if (!S && name !== 'menu') return;
  ui.sheet = name;
  if (name !== 'mail') ui.letter = null;
  document.querySelectorAll('.sheet').forEach(s => { s.hidden = s.id !== 'sheet-' + name; });
  $('#sheetBack').hidden = false;
  $('#sheet-mail').dataset.letter = '';
  renderSheet();
  if (name === 'fridge' && matchMedia('(pointer:fine)').matches) setTimeout(() => $('#addText').focus(), 60);
}

function closeSheet() {
  ui.sheet = null;
  ui.letter = null;
  document.querySelectorAll('.sheet').forEach(s => { s.hidden = true; });
  $('#sheetBack').hidden = true;
}

function renderSheet() {
  if (!ui.sheet || !S) return;
  ({ fridge: renderFridge, info: renderInfo, mail: renderMail, menu: renderMenu, timer: renderTimerSheet })[ui.sheet]();
}

function renderFridge() {
  const day = dayKey(now());
  const { open, doneToday } = fridgeList(S, day);
  const total = open.length + doneToday.length;
  $('#frProg').textContent = total
    ? `${doneToday.length}/${total} bitti · her not +1 ♡ · ${BONUS_MIN}+ notun hepsi bitince +${BONUS} ♡`
    : 'Biten her not +1 ♡';
  $('#postits').innerHTML = open.length
    ? open.map(t => `
      <div class="postit" role="button" tabindex="0" style="--c:${esc(t.color || POSTIT_COLORS[0])};--r:${tilt(t.id)}deg" data-tid="${t.id}">${esc(t.text)}${t.repeat ? '<i class="rep-i">↻ her gün</i>' : ''}${t.from === 'deniz' ? '<span class="from" title="Deniz yapıştırdı">D♡</span>' : ''}<button class="pt-del ${ui.delArm === t.id ? 'arm' : ''}" data-del="${t.id}" aria-label="Notu sil">${ui.delArm === t.id ? 'sil?' : '×'}</button></div>`).join('')
    : `<div class="fr-empty">${total ? 'Hepsi bitti! Aferin sana ♡' : 'Buzdolabı bomboş ♡<br>Bugün yapacaklarını aşağıya yaz'}</div>`;
  $('#doneList').innerHTML = doneToday.length
    ? '<h3>Bugün bitenler ♡</h3>' + doneToday.map(t => `<button class="done-it" data-undo="${t.id}"><s>${esc(t.text)}</s><span>geri al</span></button>`).join('')
    : '';
}

function renderInfo() {
  const u = unlockInfo(S, now());
  const total = u.open.length + u.doneToday.length;
  $('#sheet-info').innerHTML = `
    <div class="sheet-head"><h2>Dekorasyon ♡</h2><button class="x" data-close aria-label="Kapat">×</button></div>
    <p class="info-p">Şu an <b style="color:var(--acc)">${S.hearts} ♡</b> kalbin var. Biten her not <b>+1 ♡</b>, en az ${BONUS_MIN} notun hepsi bitince <b>+${BONUS} ♡</b> bonus.</p>
    <div class="checks">
      <div class="ck ${u.listOk ? 'ok' : ''}"><b>${u.listOk ? '✓' : '○'}</b> Buzdolabındaki notların hepsi bitti ${total ? `(${u.doneToday.length}/${total})` : ''}</div>
      <div class="ck ${u.timeOk ? 'ok' : ''}"><b>${u.timeOk ? '✓' : '○'}</b> Akşam oldu (saat ${u.hour}:00)</div>
      ${u.gift ? '<div class="ck ok"><b>🎁</b> Deniz bugün kilidi senin için açtı</div>' : ''}
    </div>
    <button class="b p big" data-go="design" ${u.unlocked ? '' : 'disabled'}>${u.unlocked ? 'Odamı süslemeye başla ✨' : u.listOk ? 'Akşamı bekliyoruz ♡' : 'Önce buzdolabındaki notlar ♡'}</button>
    ${u.unlocked || u.listOk ? '' : '<button class="b big" data-go="fridge" style="margin-top:8px">🧊 Buzdolabına git</button>'}
    <h3>Dükkanda neler var?</h3>
    <div class="grid preview">${SHOP.map(id => shopCard(id, false)).join('')}</div>`;
}

function renderMail() {
  const el = $('#sheet-mail');
  const head = back => `<div class="sheet-head">${back ? '<button class="b" data-back>‹ Mektuplar</button>' : '<h2>Mektuplar ♡</h2>'}<button class="x" data-close aria-label="Kapat">×</button></div>`;

  if (ui.letter && S.notes[ui.letter]) {
    const n = { id: ui.letter, ...S.notes[ui.letter] };
    const g = n.gift || {};
    const parts = [g.item && ITEMS[g.item] ? ITEMS[g.item].name : null, g.hearts ? `${g.hearts} ♡` : null].filter(Boolean);
    const gift = !parts.length ? ''
      : n.claimed ? `<div class="gift done">🎁 Hediyen alındı: ${esc(parts.join(' + '))}</div>`
      : `<div class="gift"><button class="b p big" data-claim="${n.id}">🎁 Hediyeni al: ${esc(parts.join(' + '))}</button></div>`;
    // Aynı mektup zaten açıksa kağıdı yeniden çizme (açılma animasyonu bozulmasın).
    if (el.dataset.letter === n.id && $('#giftBox')) { $('#giftBox').innerHTML = gift; return; }
    el.dataset.letter = n.id;
    el.innerHTML = head(true) + `
      <article class="paper"><div class="paper-date">${fmtDate(n.showAt || n.createdAt)}</div>
      <div class="paper-text">${esc(n.text).replace(/\n/g, '<br>')}</div><div class="paper-sign">— Deniz ♡</div></article>
      <div id="giftBox">${gift}</div>`;
    return;
  }

  el.dataset.letter = '';
  const list = visibleNotes(S);
  const unread = list.filter(n => !n.readAt);
  const read = list.filter(n => n.readAt);
  let h = head(false);
  if (unread.length) {
    const first = unread[unread.length - 1];
    h += `<button class="envelope-big" data-open="${first.id}"><svg viewBox="0 0 88 60" class="art" aria-hidden="true">${ENVELOPE.art}</svg>
      <b>Deniz'den ${unread.length > 1 ? unread.length + ' yeni mektup' : 'bir mektup'} var</b><span class="mut small">Açmak için dokun</span></button>`;
  } else if (!read.length) {
    h += '<div class="empty">Henüz mektup yok.<br>Kapının önüne zarf bırakılırsa burada görünür ♡</div>';
  }
  if (read.length) {
    h += '<h3>Önceki mektuplar</h3>' + read.map(n => {
      const waiting = (n.gift?.hearts || n.gift?.item) && !n.claimed;
      return `<button class="letter-row" data-open="${n.id}"><span>${fmtDate(n.showAt || n.createdAt)}${waiting ? ' · 🎁 hediye bekliyor' : ''}</span><b>${esc(firstLine(n.text))}</b></button>`;
    }).join('');
  }
  el.innerHTML = h;
}

const firstLine = s => { const l = String(s || '').split('\n')[0]; return l.length > 60 ? l.slice(0, 58) + '…' : l; };

function renderMenu() {
  const acct = store?.mode === 'cloud'
    ? `<div class="acct">${user?.photo ? `<img src="${esc(user.photo)}" alt="" referrerpolicy="no-referrer">` : ''}<div><b>${esc(user?.name || '')}</b><div class="mut small">${esc(user?.email || '')}</div></div></div>
       <button class="row-btn" data-signout>↪ Çıkış yap</button>`
    : '<div class="note-box"><b>Yerel mod</b><br>Veriler şimdilik sadece bu tarayıcıda. Firebase ayarlanınca telefonla bilgisayar eşitlenir.</div>';
  const h = S?.settings?.eveningHour ?? 18;
  $('#sheet-menu').innerHTML = `
    <div class="sheet-head"><h2>Ayarlar ♡</h2><button class="x" data-close aria-label="Kapat">×</button></div>
    <button class="row-btn" data-theme>${isDark() ? '☀ Açık tema' : '☾ Koyu tema'}</button>
    ${acct}
    <h3>Nasıl oynanır?</h3>
    <ul class="rules">
      <li>Bugün yapacaklarını <b>buzdolabına</b> post-it olarak yapıştır. Bitince üstüne dokun, koparıp at.</li>
      <li>Biten her not <b>+1 ♡</b>. En az ${BONUS_MIN} notun hepsi bitince <b>+${BONUS} ♡</b> bonus.</li>
      <li>Liste bitince ve saat <b>${h}:00</b> olunca <b>dekorasyon</b> açılır: kalplerinle eşya al, sürükleyip yerleştir.</li>
      <li><b>↻ Her gün</b> işaretli notlar her sabah yeniden gelir.</li>
      <li>Ders çalışırken kapıdaki <b>Güzin</b> tabelasına dokun ya da <b>⏱ sayacı</b> başlat: <b>Do not disturb</b> asılır, Deniz de görür. Bitince tabelaya tekrar dokun; ne kadar çalıştığın sayacın altındaki geçmişe yazılır.</li>
      <li><b>Kediyi</b> tıklayarak ya da üstünde parmağını/fareni gezdirerek sev. Her gün ilk sevişte <b>+1 ♡</b>.</li>
      <li>Sol üstteki <b>🪟</b> perdeyi, <b>💡</b> ışığı açıp kapatır. Pencereye ve kapının yanındaki düğmeye dokunmak da olur.</li>
      <li>Kapının önünde zarf görürsen aç, içinde hediye olabilir 💌</li>
    </ul>
    ${S ? `<p class="mut small" style="text-align:center;margin-top:16px">Şimdiye kadar ${S.stats?.done || 0} not bitirdin ♡</p>` : ''}`;
}

/* ---------- Buzdolabı işlemleri ---------- */

function addTodo() {
  const inp = $('#addText');
  const text = inp.value.trim();
  if (!text || !S) return;
  const id = uid();
  act([[`todos.${id}`, { text, color: ui.color, repeat: $('#addRep').checked, done: false, createdAt: Date.now() }]]);
  inp.value = '';
  inp.focus();
}

function completeTodo(id, el) {
  const t = S.todos[id];
  if (!t || el?.classList.contains('tearing')) return;
  const d = now();
  const day = dayKey(d);
  const u = unlockInfo(S, d);
  const remaining = u.open.filter(x => x.id !== id).length;
  const bonus = remaining === 0 && u.doneToday.length + 1 >= BONUS_MIN && !S.bonus[day];
  const ops = t.repeat ? [[`todos.${id}.doneDay`, day]] : [[`todos.${id}.done`, true], [`todos.${id}.doneAt`, Date.now()]];
  ops.push(['hearts', INC(bonus ? 1 + BONUS : 1)], ['stats.done', INC(1)]);
  if (bonus) ops.push([`bonus.${day}`, true]);
  const willUnlock = remaining === 0 && (u.timeOk || u.gift);

  fx('+1 ♡', el?.getBoundingClientRect());
  el?.classList.add('tearing');
  setTimeout(() => {
    act(ops);
    if (bonus) burst();
    if (remaining === 0) {
      const msg = bonus ? `Hepsi bitti! +${BONUS} ♡ bonus` : 'Hepsi bitti ♡';
      toast(willUnlock ? msg + ' · Dekorasyon açıldı ✨' : `${msg} · Dekorasyon ${hourAt(u.hour)} açılıyor`);
    }
  }, 460);
}

function undoTodo(id) {
  const t = S.todos[id];
  if (!t) return;
  const ops = t.repeat ? [[`todos.${id}.doneDay`, DEL]] : [[`todos.${id}.done`, false], [`todos.${id}.doneAt`, DEL]];
  if (S.hearts > 0) ops.push(['hearts', INC(-1)]);
  ops.push(['stats.done', INC(-1)]);
  act(ops);
}

function deleteTodo(id) {
  if (ui.delArm === id) {
    clearTimeout(ui.delT);
    ui.delArm = null;
    act([[`todos.${id}`, DEL]]);
    return;
  }
  ui.delArm = id;
  clearTimeout(ui.delT);
  ui.delT = setTimeout(() => { ui.delArm = null; if (ui.sheet === 'fridge') renderFridge(); }, 3000);
  renderFridge();
}

/* ---------- Dekorasyon ---------- */

function enterDesign() {
  if (!S || !unlockInfo(S, now()).unlocked) return;
  ui.design = true;
  ui.sel = null;
  cats.clear();
  appEl.classList.add('design');
  $('#drawer').hidden = false;
  closeSheet();
  render();
}

function exitDesign() {
  ui.design = false;
  ui.sel = null;
  appEl.classList.remove('design');
  $('#drawer').hidden = true;
  render();
}

function shopCard(id, live) {
  const d = ITEMS[id];
  const ok = S.hearts >= d.price;
  return `<button class="card-it" ${live ? `data-buy="${id}"` : ''} ${live && ok ? '' : 'disabled'}><div class="th">${thumbSVG(id)}</div><div class="nm">${esc(d.name)}</div><div class="pr">${d.price} ♡</div></button>`;
}

function swatchCard(kind, k, w) {
  const own = kind === 'wall' ? S.ownWall[k] : S.ownFloor[k];
  const cur = (kind === 'wall' ? S.wall : S.floor) === k;
  const label = cur ? 'Seçili' : own ? 'Seç' : `${w.price} ♡`;
  const dis = !cur && !own && S.hearts < w.price;
  return `<button class="card-it sw ${cur ? 'on' : ''}" data-sw="${kind}:${k}" ${dis ? 'disabled' : ''}><div class="th">${swatchSVG(kind === 'wall' ? 'wp' : 'fl', k)}</div><div class="nm">${esc(w.name)}</div><div class="pr">${label}</div></button>`;
}

function renderDrawer() {
  const inv = Object.entries(S.inventory).filter(([k, n]) => n > 0 && ITEMS[k]);
  const invN = inv.reduce((a, [, n]) => a + n, 0);
  $('#drTabs').innerHTML = [['shop', 'Dükkan'], ['inv', invN ? `Depo (${invN})` : 'Depo'], ['walls', 'Duvar & Zemin']]
    .map(([k, l]) => `<button class="tab ${ui.tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('');
  let h;
  if (ui.tab === 'shop') {
    h = `<div class="grid">${SHOP.map(id => shopCard(id, true)).join('')}</div>`;
  } else if (ui.tab === 'inv') {
    h = inv.length
      ? `<div class="grid">${inv.map(([k, n]) => `<button class="card-it" data-place="${k}"><span class="qty">${n}</span><div class="th">${thumbSVG(k)}</div><div class="nm">${esc(ITEMS[k].name)}</div><div class="pr">Yerleştir</div></button>`).join('')}</div>`
      : '<div class="empty">Depon boş. Odadan kaldırdığın ya da Deniz\'in gönderdiği eşyalar burada bekler ♡</div>';
  } else {
    h = `<h4>Duvar kağıdı</h4><div class="grid">${Object.entries(WALLS).map(([k, w]) => swatchCard('wall', k, w)).join('')}</div>
      <h4>Zemin</h4><div class="grid">${Object.entries(FLOORS).map(([k, w]) => swatchCard('floor', k, w)).join('')}</div>`;
  }
  const body = $('#drBody');
  const sc = body.scrollTop;
  body.innerHTML = h;
  body.scrollTop = sc;
}

function buy(id) {
  const d = ITEMS[id];
  if (!d || S.hearts < d.price) return;
  const pid = uid();
  const [x, y] = spawnPos(d);
  ui.sel = pid;
  act([['hearts', INC(-d.price)], [`placed.${pid}`, { item: id, x, y, z: Date.now() }]]);
  toast(`${d.name} odana geldi ♡ Sürükleyip yerleştir`);
}

function placeFromInventory(id) {
  const d = ITEMS[id];
  if (!d || !(S.inventory[id] > 0)) return;
  const pid = uid();
  const [x, y] = spawnPos(d);
  ui.sel = pid;
  act([[`inventory.${id}`, INC(-1)], [`placed.${pid}`, { item: id, x, y, z: Date.now() }]]);
}

function pickSwatch(kind, k) {
  const cat = kind === 'wall' ? WALLS : FLOORS;
  const own = kind === 'wall' ? S.ownWall : S.ownFloor;
  if (!cat[k]) return;
  if (own[k]) { act([[kind, k]]); return; }
  if (S.hearts < cat[k].price) return;
  act([['hearts', INC(-cat[k].price)], [`${kind === 'wall' ? 'ownWall' : 'ownFloor'}.${k}`, true], [kind, k]]);
  toast(`${cat[k].name} artık senin ♡`);
}

function placeSelBar() {
  const bar = $('#selBar');
  const p = ui.design && ui.sel && S.placed[ui.sel];
  const g = p && svg.querySelector(`[data-pid="${ui.sel}"]`);
  if (!g) { bar.hidden = true; return; }
  const def = ITEMS[p.item];
  bar.innerHTML = [
    !def.noFlip && '<button data-sb="flip">↔ Çevir</button>',
    (def.layer === 'wall' || def.layer === 'deco') && '<button data-sb="front">⬆ Öne</button>',
    !def.fixed && '<button data-sb="store">📦 Depoya</button>',
    '<button data-sb="close" aria-label="Seçimi bırak">✕</button>',
  ].filter(Boolean).join('');
  bar.hidden = false;
  const wr = $('#stageWrap').getBoundingClientRect();
  const r = g.getBoundingClientRect();
  let top = r.top - wr.top - 6;
  let below = false;
  if (top < 52) { top = r.bottom - wr.top + 6; below = true; }
  const bw = bar.offsetWidth;
  const left = Math.max(bw / 2 + 6, Math.min(wr.width - bw / 2 - 6, r.left - wr.left + r.width / 2));
  bar.style.left = left + 'px';
  bar.style.top = top + 'px';
  bar.classList.toggle('below', below);
}

function svgPoint(e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function onPointerDown(e) {
  if (!ui.design || !S) return;
  const g = e.target.closest('[data-pid]');
  if (!g) { if (ui.sel) { ui.sel = null; renderRoom(); } return; }
  const pid = g.dataset.pid;
  const p = S.placed[pid];
  if (!p) return;
  if (ui.sel !== pid) { ui.sel = pid; renderRoom(); }
  const el = svg.querySelector(`[data-pid="${pid}"]`);
  const pt = svgPoint(e);
  ui.drag = { pid, el, def: ITEMS[p.item], dx: pt.x - p.x, dy: pt.y - p.y, x: p.x, y: p.y, sx: e.clientX, sy: e.clientY, moved: false };
  try { svg.setPointerCapture(e.pointerId); } catch (err) {}
  e.preventDefault();
}

function onPointerMove(e) {
  const d = ui.drag;
  if (!d) {
    if (ui.design || !S) return;
    // Kedinin gözleri fareyi takip etsin; kedinin üstünde gezdirmek onu sever.
    ui.ptr = svgPoint(e);
    const g = e.target.closest?.('.it-cat');
    if (!g || !(e.pointerType === 'mouse' || e.buttons)) { ui.rubPid = null; return; }
    // Sadece kedinin üstünde gezdirilen hareket sayılır; imleç bir kez hızla geçerse sevme sayılmaz.
    if (ui.rubPid !== g.dataset.pid) { ui.rubPid = g.dataset.pid; ui.rub = 0; return; }
    ui.rub += Math.min(30, Math.hypot(e.movementX || 0, e.movementY || 0));
    const t = performance.now();
    if (ui.rub > 180 && t - ui.lastRub > 700) { ui.rub = 0; ui.lastRub = t; petCat(g.dataset.pid, e.clientX, e.clientY, true); }
    return;
  }
  if (!d.moved) {
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return;
    d.moved = true;
    d.el.classList.add('dragging');
    $('#selBar').hidden = true;
  }
  const pt = svgPoint(e);
  [d.x, d.y] = clampPos(d.def, pt.x - d.dx, pt.y - d.dy);
  d.el.setAttribute('transform', `translate(${d.x} ${d.y})`);
}

function onPointerUp() {
  const d = ui.drag;
  if (!d) return;
  ui.drag = null;
  if (d.moved) {
    const ops = [[`placed.${d.pid}.x`, d.x], [`placed.${d.pid}.y`, d.y]];
    if (d.def.layer === 'wall' || d.def.layer === 'deco') ops.push([`placed.${d.pid}.z`, Date.now()]);
    ui.pending = false;
    act(ops);
  } else if (ui.pending) {
    ui.pending = false;
    render();
  } else {
    placeSelBar();
  }
}

function onRoomClick(e) {
  if (ui.design || !S) return;
  if (e.target.closest('[data-act="mail"]')) { openSheet('mail'); return; }
  if (e.target.closest('[data-act="sign"]')) { toggleDnd(); return; }
  if (e.target.closest('[data-act="light"]')) { toggleLight(); return; }
  const g = e.target.closest('[data-pid]');
  if (!g) return;
  const item = g.dataset.item;
  if (item === 'fridge') { openSheet('fridge'); return; }
  if (item === 'door' && unreadNotes(S).length) { openSheet('mail'); return; }
  if (item === 'window') { toggleCurtain(); return; }
  if (item === 'cat') { petCat(g.dataset.pid, e.clientX, e.clientY, false); return; }
  g.classList.remove('wiggle');
  g.getBoundingClientRect();
  g.classList.add('wiggle');
  setTimeout(() => g.classList.remove('wiggle'), 520);
  if (item === 'teddy') bubble('♡', e.clientX, e.clientY);
}

/* ---------- Kedi ---------- */
// Kedi odada kendi kendine dolaşır: oturur, gezinir, uyur. Bu sadece ekranda olur;
// kayıtlı yeri "evi"dir (dekorasyonda oraya konur, sayfa açılınca oradan başlar).

const cats = new Map();
let catRAF = 0;
let catLast = 0;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);

function syncCats() {
  const ids = Object.entries(S.placed).filter(([, p]) => p.item === 'cat').map(([pid]) => pid);
  for (const id of [...cats.keys()]) if (!ids.includes(id)) cats.delete(id);
  if (ui.design) return;
  const night = skyPhase(now()) === 'night';
  const t = performance.now();
  for (const id of ids) {
    if (cats.has(id)) continue;
    const p = S.placed[id];
    cats.set(id, { x: p.x, y: p.y, pose: night ? 'sleep' : 'sit', flip: !!p.flip, until: t + rand(2500, 6000), look: [0, 0] });
  }
  if (cats.size && !catRAF) { catLast = t; catRAF = requestAnimationFrame(catLoop); }
}

function catOverrides() {
  if (ui.design) return null;
  const o = {};
  for (const [id, c] of cats) o[id] = { x: Math.round(c.x), y: Math.round(c.y), pose: c.pose, flip: c.flip, look: c.look };
  return o;
}

function startWalk(c) {
  const { W, H, WALL } = STAGE;
  const d = ITEMS.cat;
  let tx = rand(10, W - d.w - 10);
  if (Math.abs(tx - c.x) < 140) tx = c.x + (tx >= c.x ? 180 : -180);
  tx = Math.max(10, Math.min(W - d.w - 10, tx));
  c.tx = tx;
  // Odanın ön şeridinde gezinsin; böylece mobilyaların önünden geçer, üstlerinden değil.
  c.ty = rand(Math.max(WALL + 95, H - 68), H - 6) - d.h;
  c.flip = tx < c.x;
  c.pose = 'walk';
}

function catLoop(ts) {
  catRAF = 0;
  if (ui.design || !S || !cats.size) return;
  const dt = Math.min(0.1, (ts - catLast) / 1000);
  catLast = ts;
  const night = skyPhase(now()) === 'night';
  for (const [id, c] of cats) {
    const pose0 = c.pose, flip0 = c.flip, x0 = c.x, y0 = c.y, look0 = c.look;
    if (c.pose === 'walk') {
      const dx = c.tx - c.x, dy = c.ty - c.y, dist = Math.hypot(dx, dy), step = 70 * dt;
      if (dist <= step) { c.x = c.tx; c.y = c.ty; c.pose = 'sit'; c.until = ts + rand(4000, 9000); }
      else { c.x += dx / dist * step; c.y += dy / dist * step; }
    } else if (ts > c.until) {
      if (c.pose === 'happy') { c.pose = 'sit'; c.until = ts + rand(3000, 7000); }
      else if (c.pose === 'sleep') {
        if (Math.random() < (night ? .25 : .7)) { c.pose = 'sit'; c.until = ts + rand(4000, 8000); }
        else c.until = ts + rand(10000, 20000);
      } else {
        const r = Math.random();
        if (!reduceMotion && r < (night ? .3 : .6)) startWalk(c);
        else if (r < (night ? .85 : .75)) { c.pose = 'sleep'; c.until = ts + rand(15000, 40000); }
        else c.until = ts + rand(3000, 7000);
      }
    }
    if (c.pose === 'sit' && ui.ptr) {
      const k = (v, s) => Math.max(-1, Math.min(1, v / s));
      const lx = k(ui.ptr.x - (c.x + 66), 110) * 2.6;
      c.look = [c.flip ? -lx : lx, k(ui.ptr.y - (c.y + 34), 110) * 2];
    }
    const full = pose0 !== c.pose || flip0 !== c.flip;
    if (full || x0 !== c.x || y0 !== c.y || look0 !== c.look) drawCat(id, c, full);
  }
  catRAF = requestAnimationFrame(catLoop);
}

function drawCat(id, c, full) {
  const g = svg.querySelector(`[data-pid="${id}"]`);
  if (!g) return;
  g.setAttribute('transform', `translate(${Math.round(c.x)} ${Math.round(c.y)})`);
  if (full) {
    const d = ITEMS.cat;
    const art = d.art({ pose: c.pose, look: c.look });
    g.querySelector('.art').innerHTML = c.flip ? `<g transform="translate(${d.w} 0) scale(-1 1)">${art}</g>` : art;
    g.setAttribute('class', `it it-cat pose-${c.pose}`);
  } else if (c.pose === 'sit') {
    const e = g.querySelector('.cat-eyes > g');
    if (e) e.setAttribute('transform', `translate(${c.look[0].toFixed(1)} ${c.look[1].toFixed(1)})`);
  }
}

function petCat(pid, x, y, soft) {
  const c = cats.get(pid);
  if (c) { c.pose = 'happy'; c.until = performance.now() + 2600; drawCat(pid, c, true); }
  if (!soft || Math.random() < .5) bubble(['mrrr ♡', 'prrr ♡', 'miyav ♡', 'mır mır ♡'][Math.floor(Math.random() * 4)], x, y);
  sparkHearts(x, y, soft ? 3 : 6);
  const day = dayKey(now());
  if (S.petDay !== day) {
    act([['petDay', day], ['hearts', INC(1)]]);
    toast('Kedi seni çok sevdi ♡ Bugünün kedi kalbi: +1 ♡');
  }
}

/* ---------- Perde ve ışık ---------- */

function toggleCurtain() {
  act([['curtain', !S.curtain]]);
}

function toggleLight() {
  act([['light', !S.light]]);
}

/* ---------- Kapı tabelası ---------- */

function dndLabel() {
  const min = Math.floor((Date.now() - S.dnd.since) / 60000);
  return min < 1 ? 'yeni asıldı' : fmtDur(min);
}

function toggleDnd() {
  ui.swingUntil = Date.now() + 900;
  if (dndActive(S)) {
    const start = S.dnd.since, end = Date.now();
    const min = Math.floor((end - start) / 60000);
    const ops = [['dnd', DEL]];
    // En az bir dakika sürdüyse çalışma geçmişine yaz.
    if (min >= 1) ops.push([`studyLog.${uid()}`, { start, end }]);
    act(ops);
    toast(min >= 1 ? `Kapı tekrar açık ♡ ${fmtDur(min)} çalıştın, aferin` : 'Kapı tekrar açık ♡');
  } else {
    act([['dnd', { since: Date.now() }]]);
    toast('📚 Kapıya "Do not disturb" asıldı. İyi çalışmalar ♡');
  }
}

/* ---------- Sayaç ---------- */

function timerTick() {
  if (!S) return;
  const t = S.timer;
  const st = timerState(t);
  const rem = timerRemaining(t);
  if (st === 'run' && rem <= 0 && ui.timerFired !== t.endAt) {
    ui.timerFired = t.endAt;
    timerDone(t);
    return;
  }
  const txt = (st === 'pause' ? '⏸ ' : '⏱ ') + mmss(rem);
  const btn = $('#timerBtn');
  if (txt !== ui.timerTxt) {
    ui.timerTxt = txt;
    $('#timerTxt').textContent = mmss(rem);
    $('#timerIc').textContent = st === 'pause' ? '⏸' : '⏱';
    document.title = st === 'run' ? `${mmss(rem)} · Güzin'in Odası ♡` : "Güzin'in Odası ♡";
    if (ui.sheet === 'timer') updateTimerDisplay();
  }
  btn.classList.toggle('run', st === 'run');
  btn.classList.toggle('paused', st === 'pause');
}

function timerDone(t) {
  const late = Date.now() - t.endAt > 60000;
  if (S.timer.endAt === t.endAt) act([['timer.endAt', null], ['timer.left', DEL]]);
  // Uygulama kapalıyken bitmişse sonradan açılışta öttürme.
  if (late) return;
  beep();
  const b = $('#timerBtn');
  b.classList.remove('ring');
  b.getBoundingClientRect();
  b.classList.add('ring');
  setTimeout(() => b.classList.remove('ring'), 6000);
  toast(t.label === 'Mola' ? 'Mola bitti, hadi devam ♡' : `Süre doldu! Bir mola hak ettin ♡${dndActive(S) ? ' Bitirdiysen kapıdaki tabelayı kaldır.' : ''}`);
}

function timerStartPause() {
  const t = S.timer;
  const st = timerState(t);
  if (st === 'run') { act([['timer.endAt', null], ['timer.left', timerRemaining(t)]]); return; }
  const secs = st === 'pause' ? t.left : t.dur;
  if (!(secs > 0)) return;
  const ops = [['timer.endAt', Date.now() + secs * 1000], ['timer.left', DEL]];
  let msg = '⏱ Sayaç başladı ♡';
  if (t.label !== 'Mola' && !dndActive(S)) {
    ops.push(['dnd', { since: Date.now() }]);
    ui.swingUntil = Date.now() + 900;
    msg = '⏱ Sayaç başladı, kapıya "Do not disturb" asıldı ♡';
  }
  unlockAudio();
  act(ops);
  toast(msg);
}

function timerReset() {
  act([['timer.endAt', null], ['timer.left', DEL]]);
}

function setTimerDur(secs, label) {
  if (timerState(S.timer) !== 'idle') return;
  const v = Math.max(5, Math.min(180 * 60, Math.round(secs)));
  const ops = [['timer.dur', v]];
  if (label) ops.push(['timer.label', label]);
  act(ops);
}

function renderTimerSheet() {
  updateTimerDisplay();
  renderStudyLog();
}

function updateTimerDisplay() {
  const t = S.timer;
  const st = timerState(t);
  const rem = timerRemaining(t);
  const m = $('#tMin'), s = $('#tSec');
  const idle = st === 'idle';
  if (document.activeElement !== m) m.value = String(Math.floor(rem / 60)).padStart(2, '0');
  if (document.activeElement !== s) s.value = String(rem % 60).padStart(2, '0');
  m.disabled = s.disabled = !idle;
  document.querySelectorAll('#sheet-timer [data-adj], #sheet-timer [data-preset]').forEach(b => { b.disabled = !idle; });
  document.querySelectorAll('#sheet-timer [data-preset]').forEach(b => {
    const [mins, label] = b.dataset.preset.split(':');
    b.classList.toggle('on', idle && t.dur === mins * 60 && (t.label || 'Odak') === label);
  });
  $('#tMode').textContent = st === 'run' ? `${t.label || 'Odak'} · çalışıyor` : st === 'pause' ? `${t.label || 'Odak'} · duraklatıldı` : (t.label || 'Odak');
  $('#tGo').textContent = st === 'run' ? 'Duraklat' : st === 'pause' ? 'Devam et' : 'Başlat';
  $('#tReset').disabled = idle;
  $('#timerFace').classList.toggle('run', st === 'run');
}

/* ---------- Çalışma geçmişi ---------- */

function renderStudyLog() {
  const list = studySessions(S);
  const tot = studyTotals(list);
  const el = $('#studyLog');
  if (!list.length) {
    el.innerHTML = '<div class="empty">Henüz kayıt yok.<br>Ders çalışırken kapıdaki tabelaya dokun ya da sayacı başlat; tabelayı kaldırınca burada görünür ♡</div>';
    return;
  }
  const groups = new Map();
  for (const s of list) {
    const k = dayKey(new Date(s.start));
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(s);
  }
  let h = `<div class="log-tot"><div><b>${fmtDur(tot.today)}</b><span>bugün</span></div><div><b>${fmtDur(tot.week)}</b><span>son 7 gün</span></div></div>`;
  for (const [, items] of groups) {
    const dayMin = Math.floor(items.reduce((a, s) => a + (s.end - s.start), 0) / 60000);
    h += `<div class="log-day"><b>${dayLabel(items[0].start)}</b><span>${fmtDur(dayMin)}</span></div>`;
    h += items.map(s => {
      const min = Math.floor((s.end - s.start) / 60000);
      const right = s.current
        ? '<span class="log-now">şu an</span>'
        : `<button class="log-del ${ui.logArm === s.id ? 'arm' : ''}" data-logdel="${s.id}" aria-label="Kaydı sil">${ui.logArm === s.id ? 'sil?' : '×'}</button>`;
      return `<div class="log-row${s.current ? ' cur' : ''}"><span class="log-t">${hm(s.start)} – ${s.current ? 'şimdi' : hm(s.end)}</span><span class="log-d">${min < 1 ? '1 dk\'dan az' : fmtDur(min)}</span>${right}</div>`;
    }).join('');
  }
  el.innerHTML = h;
}

function deleteLog(id) {
  clearTimeout(ui.logT);
  if (ui.logArm === id) { ui.logArm = null; act([[`studyLog.${id}`, DEL]]); return; }
  ui.logArm = id;
  ui.logT = setTimeout(() => { ui.logArm = null; if (ui.sheet === 'timer') renderStudyLog(); }, 3000);
  renderStudyLog();
}

/* ---------- Ses ---------- */

let audioCtx = null;
function unlockAudio() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
}

function beep() {
  try {
    unlockAudio();
    const a = audioCtx;
    [0, .22, .44, .9, 1.12, 1.34].forEach((t, i) => {
      const o = a.createOscillator();
      const g = a.createGain();
      o.frequency.value = [784, 988, 1175][i % 3];
      g.gain.setValueAtTime(.0001, a.currentTime + t);
      g.gain.exponentialRampToValueAtTime(.25, a.currentTime + t + .02);
      g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + t + .18);
      o.connect(g).connect(a.destination);
      o.start(a.currentTime + t);
      o.stop(a.currentTime + t + .2);
    });
  } catch (e) {}
}

/* ---------- Mektuplar ---------- */

function openLetter(id) {
  const n = S.notes[id];
  if (!n) return;
  ui.letter = id;
  renderMail();
  if (!n.readAt) act([[`notes.${id}.readAt`, Date.now()]]);
}

function claimGift(id) {
  const n = S.notes[id];
  if (!n || n.claimed) return;
  const g = n.gift || {};
  const ops = [[`notes.${id}.claimed`, true]];
  if (g.hearts) ops.push(['hearts', INC(g.hearts)]);
  if (g.item && ITEMS[g.item]) ops.push([`inventory.${g.item}`, INC(1)]);
  act(ops);
  burst();
  toast(g.item && ITEMS[g.item] ? `${ITEMS[g.item].name} depona eklendi ♡ Dekorasyonda yerleştirebilirsin` : `+${g.hearts} ♡`);
}

/* ---------- Küçük efektler ---------- */

function fx(text, rect) {
  const s = document.createElement('div');
  s.className = 'fx';
  s.textContent = text;
  s.style.left = ((rect ? rect.left + rect.width / 2 : innerWidth / 2) - 22) + 'px';
  s.style.top = ((rect ? rect.top + 8 : innerHeight / 2)) + 'px';
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 1200);
}

function burst() {
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('div');
    s.className = 'fx';
    s.textContent = '♡';
    s.style.left = (innerWidth / 2 + (Math.random() - .5) * 240) + 'px';
    s.style.top = (innerHeight / 2 + (Math.random() - .5) * 140) + 'px';
    s.style.fontSize = (16 + Math.random() * 20) + 'px';
    s.style.animationDelay = (Math.random() * .25) + 's';
    s.style.setProperty('--dx', ((Math.random() - .5) * 140) + 'px');
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1700);
  }
}

function sparkHearts(x, y, n) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = 'fx';
    s.textContent = '♡';
    s.style.left = (x - 8 + (Math.random() - .5) * 50) + 'px';
    s.style.top = (y - 10 + (Math.random() - .5) * 20) + 'px';
    s.style.fontSize = (14 + Math.random() * 10) + 'px';
    s.style.animationDelay = (Math.random() * .2) + 's';
    s.style.setProperty('--dx', ((Math.random() - .5) * 70) + 'px');
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1500);
  }
}

function bubble(text, x, y) {
  const s = document.createElement('div');
  s.className = 'bubble';
  s.textContent = text;
  s.style.left = (x - 30) + 'px';
  s.style.top = (y - 40) + 'px';
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 1500);
}

let toastT = null;
function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.hidden = true;
  el.getBoundingClientRect();
  el.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { el.hidden = true; }, 3000);
}

function pulse(el) {
  el.classList.remove('pulse');
  el.getBoundingClientRect();
  el.classList.add('pulse');
}

function isDark() {
  const a = document.documentElement.getAttribute('data-theme');
  return a ? a === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}

function toggleTheme() {
  const t = isDark() ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('oda_tema', t); } catch (e) {}
  renderMenu();
}

/* ---------- Sabit olay bağlantıları ---------- */

function setupStatic() {
  $('#cdots').innerHTML = POSTIT_COLORS.map((c, i) => `<button type="button" class="cdot ${i === 0 ? 'on' : ''}" data-color="${c}" style="background:${c}" aria-label="Renk ${i + 1}"></button>`).join('');
  $('#cdots').addEventListener('click', e => {
    const b = e.target.closest('[data-color]');
    if (!b) return;
    ui.color = b.dataset.color;
    document.querySelectorAll('.cdot').forEach(x => x.classList.toggle('on', x === b));
  });
  $('#addForm').addEventListener('submit', e => { e.preventDefault(); addTodo(); });
  $('#loginArt').innerHTML = thumbSVG('fridge', { postits: ['#fff3a6', '#ffd1e3', '#c9f0dd'] });

  $('#signInBtn').onclick = async () => {
    $('#loginErr').textContent = '';
    try { await store.signIn(); } catch (e) { onError(e); }
  };
  $('#switchBtn').onclick = () => store?.signOut();
  $('#fridgeBtn').onclick = () => openSheet('fridge');
  $('#decorBtn').onclick = () => { if (S) unlockInfo(S, now()).unlocked ? enterDesign() : openSheet('info'); };
  $('#heartsBtn').onclick = () => openSheet('info');
  $('#timerBtn').onclick = () => openSheet('timer');
  $('#curtainBtn').onclick = () => S && toggleCurtain();
  $('#lightBtn').onclick = () => S && toggleLight();
  svg.addEventListener('pointerleave', () => { ui.ptr = null; });

  // Sayaç sayfası
  $('#tGo').onclick = () => S && timerStartPause();
  $('#tReset').onclick = () => S && timerReset();
  const readInputs = () => (Number($('#tMin').value) || 0) * 60 + Math.min(59, Number($('#tSec').value) || 0);
  ['#tMin', '#tSec'].forEach(id => {
    $(id).addEventListener('change', () => S && setTimerDur(readInputs()));
    $(id).addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
  });
  $('#sheet-timer').addEventListener('click', e => {
    if (!S) return;
    const adj = e.target.closest('[data-adj]');
    if (adj) {
      const [unit, n] = adj.dataset.adj.split(':');
      setTimerDur(S.timer.dur + Number(n) * (unit === 'm' ? 60 : 1));
      return;
    }
    const pr = e.target.closest('[data-preset]');
    if (pr) { const [m, label] = pr.dataset.preset.split(':'); setTimerDur(Number(m) * 60, label); return; }
    const del = e.target.closest('[data-logdel]');
    if (del) deleteLog(del.dataset.logdel);
  });
  $('#tPresets').innerHTML = PRESETS.map(([m, l]) => `<button class="tab" data-preset="${m}:${l}">${m} dk${l === 'Mola' ? ' mola' : ''}</button>`).join('');
  $('#mailBtn').onclick = () => openSheet('mail');
  $('#menuBtn').onclick = () => openSheet('menu');
  $('#doneDesign').onclick = exitDesign;
  $('#today').onclick = e => openSheet(e.target.closest('.mailnote') ? 'mail' : 'fridge');
  $('#today').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSheet('fridge'); } };
  $('#sheetBack').onclick = closeSheet;

  document.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { closeSheet(); return; }
    const go = e.target.closest('[data-go]');
    if (go) { go.dataset.go === 'design' ? enterDesign() : openSheet(go.dataset.go); }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (ui.sheet) closeSheet();
    else if (ui.sel) { ui.sel = null; renderRoom(); }
  });
  addEventListener('resize', () => { if (S) { placeSelBar(); placeRoomCtrls(); } });
  // Oda alanı her boyut değiştirdiğinde (alt kart büyüyüp küçülünce de) köşe düğmeleri yerinde kalsın.
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (S) { placeSelBar(); placeRoomCtrls(); } }).observe($('#stageWrap'));

  $('#sheet-fridge').addEventListener('click', e => {
    const del = e.target.closest('[data-del]');
    if (del) { e.stopPropagation(); deleteTodo(del.dataset.del); return; }
    const pt = e.target.closest('[data-tid]');
    if (pt) { completeTodo(pt.dataset.tid, pt); return; }
    const un = e.target.closest('[data-undo]');
    if (un) undoTodo(un.dataset.undo);
  });
  $('#sheet-fridge').addEventListener('keydown', e => {
    const pt = e.target.closest('.postit');
    if (pt && e.target === pt && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); completeTodo(pt.dataset.tid, pt); }
  });
  $('#sheet-mail').addEventListener('click', e => {
    const o = e.target.closest('[data-open]');
    if (o) { openLetter(o.dataset.open); return; }
    if (e.target.closest('[data-back]')) { ui.letter = null; renderMail(); return; }
    const c = e.target.closest('[data-claim]');
    if (c) claimGift(c.dataset.claim);
  });
  $('#sheet-menu').addEventListener('click', e => {
    if (e.target.closest('[data-theme]')) toggleTheme();
    else if (e.target.closest('[data-signout]')) { closeSheet(); store.signOut(); }
  });
  $('#drawer').addEventListener('click', e => {
    const t = e.target.closest('[data-tab]');
    if (t) { ui.tab = t.dataset.tab; $('#drBody').scrollTop = 0; renderDrawer(); return; }
    const b = e.target.closest('[data-buy]');
    if (b) { buy(b.dataset.buy); return; }
    const p = e.target.closest('[data-place]');
    if (p) { placeFromInventory(p.dataset.place); return; }
    const s = e.target.closest('[data-sw]');
    if (s) pickSwatch(...s.dataset.sw.split(':'));
  });
  $('#selBar').addEventListener('click', e => {
    const b = e.target.closest('[data-sb]');
    if (!b) return;
    const pid = ui.sel;
    const p = S.placed[pid];
    if (!p) return;
    const a = b.dataset.sb;
    if (a === 'flip') act([[`placed.${pid}.flip`, !p.flip]]);
    else if (a === 'front') act([[`placed.${pid}.z`, Date.now()]]);
    else if (a === 'store') {
      ui.sel = null;
      act([[`placed.${pid}`, DEL], [`inventory.${p.item}`, INC(1)]]);
      toast(`${ITEMS[p.item].name} depoya kaldırıldı`);
    } else { ui.sel = null; renderRoom(); }
  });

  svg.addEventListener('pointerdown', onPointerDown);
  svg.addEventListener('pointermove', onPointerMove);
  svg.addEventListener('pointerup', onPointerUp);
  svg.addEventListener('pointercancel', onPointerUp);
  svg.addEventListener('click', onRoomClick);
}
