// Deniz paneli: odayı izle, mektup ve hediye bırak, kilidi aç, gerekirse düzelt ya da sıfırla.

import { createStore, DEL } from './store.js';
import { ITEMS, SHOP, GIFTS, WALLS, FLOORS, defaultState } from './catalog.js';
import { roomSVG } from './room.js';
import { setupServiceWorker } from './sw-update.js';
import { dayKey, uid, now, fridgeList, unlockInfo, isDone, esc, fmtDate, normalize, pad, dndActive, fmtDur } from './logic.js';

const $ = s => document.querySelector(s);
let store = null;
let S = null;
let user = null;
// Silme işlemleri iki adımlı: ilk basışta "emin misin?", 3 sn içinde ikinci basışta silinir.
let armed = null;
let armT = null;

const act = ops => store.apply(ops);

init();

async function init() {
  setup();
  try {
    store = await createStore();
  } catch (e) {
    $('#loading p').textContent = 'Bağlantı kurulamadı, sayfayı yenile.';
    return;
  }
  if (store.mode === 'local') $('#localNote').hidden = false;
  store.start({ seed: defaultState, onUser, onState, onError });
  setInterval(() => S && render(), 30000);
  setupServiceWorker();
}

function onUser(u) {
  user = u;
  renderAcct();
  if (store.mode !== 'cloud') return;
  $('#denied').hidden = true;
  $('#login').hidden = !!u;
  $('#loading').hidden = !u || !!S;
  if (!u) S = null;
}

function onState(st) {
  S = normalize(st);
  $('#loading').hidden = true;
  $('#denied').hidden = true;
  render();
}

function onError(e) {
  console.error(e);
  if (e && e.code === 'permission-denied') {
    $('#loading').hidden = true;
    $('#deniedMsg').textContent = `${user?.email || 'Bu hesap'} odaya erişemiyor. Firestore kurallarındaki e-postaları kontrol et.`;
    $('#denied').hidden = false;
  } else if (e && String(e.code || '').startsWith('auth/')) {
    $('#loginErr').textContent = 'Giriş olmadı: ' + e.code;
  }
}

function render() {
  renderStatus();
  const d = now();
  const { open } = fridgeList(S, dayKey(d));
  const unread = Object.values(S.notes).filter(n => (n.showAt || 0) <= Date.now() && !n.readAt).length;
  $('#room').innerHTML = roomSVG(S, { now: d, postits: open.map(t => t.color), unread, dnd: dndActive(S) });
  renderNotes();
  renderTodos();
  renderManage();
}

function renderAcct() {
  $('#acct').innerHTML = store?.mode === 'cloud' && user
    ? `<span class="mut small">${esc(user.email)}</span><button class="b" id="outBtn">Çıkış</button>`
    : store?.mode === 'local' ? '<span class="chip">Yerel mod</span>' : '';
  const out = $('#outBtn');
  if (out) out.onclick = () => store.signOut();
}

function renderStatus() {
  const u = unlockInfo(S, now());
  const total = u.open.length + u.doneToday.length;
  const placed = Object.values(S.placed).filter(p => ITEMS[p.item] && !ITEMS[p.item].fixed).length;
  const lockTxt = u.unlocked
    ? (u.gift && !(u.listOk && u.timeOk) ? 'Bugün kilidi sen açtın 🎁' : 'Açık ✨ odasını süsleyebilir')
    : u.listOk ? `Liste bitti, saat ${u.hour}:00 bekleniyor` : `${u.open.length} not kaldı`;
  const dnd = dndActive(S);
  const dndMin = dnd ? Math.floor((Date.now() - S.dnd.since) / 60000) : 0;
  const door = dnd
    ? `<div class="door on">📚 Kapıda <b>Do not disturb</b> asılı, ders çalışıyor (${dndMin < 1 ? 'yeni başladı' : fmtDur(dndMin)}). Şimdi rahatsız etme ♡</div>`
    : '<div class="door">🚪 Kapı açık, tabelada "Güzin" yazıyor.</div>';
  $('#status').innerHTML = `
    <h2>Güzin bugün</h2>
    <div class="stats">
      <div class="stat"><b>${S.hearts} ♡</b><span>kalbi var</span></div>
      <div class="stat"><b>${total ? `${u.doneToday.length}/${total}` : '–'}</b><span>bugünkü not</span></div>
      <div class="stat"><b>${placed}</b><span>eşya odada</span></div>
    </div>
    ${door}
    <div class="lock">Dekorasyon: <b>${lockTxt}</b></div>
    <div class="btn-row">
      ${u.gift
        ? '<button class="b" data-unlock="off">Bugünkü kilidi geri al</button>'
        : '<button class="b p" data-unlock="on">🎁 Bugün kilidi aç</button>'}
      <label style="flex-direction:row;align-items:center;gap:6px;margin-left:auto">Akşam saati
        <select id="hourSel" style="width:auto">${[15, 16, 17, 18, 19, 20, 21, 22].map(h => `<option value="${h}" ${h === u.hour ? 'selected' : ''}>${h}:00</option>`).join('')}</select>
      </label>
    </div>
    <p class="mut small" style="margin:10px 0 0">Toplam ${S.stats?.done || 0} not bitirdi.</p>`;
  $('#hourSel').onchange = e => act([['settings.eveningHour', Number(e.target.value)]]);
}

function noteStatus(n) {
  const t = Date.now();
  if ((n.showAt || 0) > t) return ['wait', `⏳ ${fmtDate(n.showAt)} tarihinde görünecek`];
  if (!n.readAt) return ['new', '📬 Kapının önünde, henüz açmadı'];
  return ['read', `💌 Okudu · ${fmtDate(n.readAt)}`];
}

const delBtn = (key, label, cls = 'del', armLabel = 'Emin misin? Sil') => `<button class="${cls} ${armed === key ? 'arm' : ''}" data-rm="${key}">${armed === key ? armLabel : label}</button>`;

function renderNotes() {
  const list = Object.entries(S.notes).map(([id, n]) => ({ id, ...n })).sort((a, b) => (b.showAt || 0) - (a.showAt || 0));
  $('#notes').innerHTML = list.length ? list.map(n => {
    const [cls, txt] = noteStatus(n);
    const g = n.gift || {};
    const parts = [g.item && ITEMS[g.item] ? ITEMS[g.item].name : null, g.hearts ? `${g.hearts} ♡` : null].filter(Boolean);
    const giftTxt = parts.length ? `🎁 ${parts.join(' + ')} · ${n.claimed ? 'aldı' : 'henüz almadı'}` : '';
    return `<div class="nrow"><div class="meta"><span class="st ${cls}">${txt}</span>${delBtn('note:' + n.id, 'Sil')}</div>
      <div class="tx">${esc(n.text)}</div>${giftTxt ? `<div class="g">${esc(giftTxt)}</div>` : ''}</div>`;
  }).join('') : '<p class="mut small">Henüz mektup yok. Açılış günü için bir hoş geldin mektubu bırakmaya ne dersin? ♡</p>';
}

function renderTodos() {
  const day = dayKey(now());
  const { open, doneToday } = fridgeList(S, day);
  const all = [...open, ...doneToday];
  $('#todos').innerHTML = all.length ? `<div class="tlist">${all.map(t => `<div class="tl-it ${isDone(t, day) ? 'done' : ''}"><i style="background:${esc(t.color)}"></i>${esc(t.text)}<small>${t.from === 'deniz' ? 'D♡ ' : ''}${t.repeat ? '↻' : ''}</small>${delBtn('todo:' + t.id, '×', 'x-del')}</div>`).join('')}</div>`
    : '<p class="mut small">Buzdolabında not yok.</p>';
}

function renderManage() {
  const hv = $('#hVal');
  if (document.activeElement !== hv) hv.value = S.hearts;
  const chip = (key, label) => delBtn(key, `${esc(label)} ×`, 'chip-x');
  const placed = Object.entries(S.placed).filter(([, p]) => ITEMS[p.item] && !ITEMS[p.item].fixed);
  const inv = Object.entries(S.inventory).filter(([k, n]) => n > 0 && ITEMS[k]);
  const walls = Object.keys(S.ownWall).filter(k => WALLS[k] && WALLS[k].price);
  const floors = Object.keys(S.ownFloor).filter(k => FLOORS[k] && FLOORS[k].price);
  const none = t => `<span class="mut small">${t}</span>`;
  $('#manage').innerHTML = `
    <h3>Odadaki eşyalar</h3>
    <div class="chips">${placed.map(([pid, p]) => chip('placed:' + pid, ITEMS[p.item].name)).join('') || none('Sabit eşyalardan başka bir şey yok.')}</div>
    <h3>Depodaki eşyalar</h3>
    <div class="chips">${inv.map(([k, n]) => chip('inv:' + k, ITEMS[k].name + (n > 1 ? ` (${n})` : ''))).join('') || none('Depo boş.')}</div>
    <h3>Satın alınan duvar kağıdı ve zeminler</h3>
    <div class="chips">${[...walls.map(k => chip('wall:' + k, WALLS[k].name)), ...floors.map(k => chip('floor:' + k, FLOORS[k].name))].join('') || none('Sadece başlangıçtakiler var.')}</div>
    <h3>Her şeyi sıfırla</h3>
    <p class="mut small" style="margin:0 0 8px">Kalpler, eşyalar, notlar, mektuplar ve duvar kağıtları silinir, oda ilk günkü haline (5 ♡) döner. Güzin'e vermeden önce denemeleri temizlemek için.</p>
    ${delBtn('reset', 'Odayı baştan kur', 'b danger', 'Emin misin? Her şey silinecek')}`;
}

// Silinecek şeyin anahtarına göre işlemi yap.
function remove(key) {
  const i = key.indexOf(':');
  const kind = i < 0 ? key : key.slice(0, i);
  const id = i < 0 ? '' : key.slice(i + 1);
  if (kind === 'note') return act([[`notes.${id}`, DEL]]);
  if (kind === 'todo') return act([[`todos.${id}`, DEL]]);
  if (kind === 'placed') return act([[`placed.${id}`, DEL]]);
  if (kind === 'inv') return act([[`inventory.${id}`, DEL]]);
  if (kind === 'wall') return act([[`ownWall.${id}`, DEL], ...(S.wall === id ? [['wall', 'dots']] : [])]);
  if (kind === 'floor') return act([[`ownFloor.${id}`, DEL], ...(S.floor === id ? [['floor', 'wood']] : [])]);
  if (kind === 'reset') { store.replace(defaultState()); toast('Oda ilk günkü haline döndü ♡'); }
}

function itemOptions() {
  const opt = k => `<option value="${k}">${esc(ITEMS[k].name)}</option>`;
  return `<option value="">Yok</option><optgroup label="Sadece senden (dükkanda yok)">${GIFTS.map(opt).join('')}</optgroup><optgroup label="Dükkan eşyaları">${SHOP.map(opt).join('')}</optgroup>`;
}

function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.hidden = true; }, 2800);
}

function setup() {
  $('#nItem').innerHTML = itemOptions();
  $('#nWhen').onchange = e => {
    const later = e.target.value === 'later';
    $('#atWrap').hidden = !later;
    if (later && !$('#nAt').value) {
      const d = new Date(Date.now() + 864e5);
      $('#nAt').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T21:00`;
    }
  };
  $('#noteForm').onsubmit = e => {
    e.preventDefault();
    if (!S) return;
    const text = $('#nText').value.trim();
    if (!text) return;
    let showAt = Date.now();
    if ($('#nWhen').value === 'later') {
      const t = new Date($('#nAt').value).getTime();
      if (!t) { $('#nMsg').textContent = 'Tarih seçmeyi unutma.'; return; }
      showAt = t;
    }
    const hearts = Number($('#nHearts').value) || 0;
    const item = $('#nItem').value || null;
    act([[`notes.${uid()}`, { text, createdAt: Date.now(), showAt, gift: hearts || item ? { hearts, item } : null }]]);
    $('#nText').value = '';
    $('#nHearts').value = '0';
    $('#nItem').value = '';
    $('#nMsg').textContent = '';
    toast(showAt > Date.now() + 60000 ? `Mektup ${fmtDate(showAt)} tarihinde kapının önünde olacak ♡` : 'Mektup kapının önünde ♡');
  };
  $('#todoForm').onsubmit = e => {
    e.preventDefault();
    const text = $('#tText').value.trim();
    if (!text || !S) return;
    act([[`todos.${uid()}`, { text, color: '#ffd1e3', from: 'deniz', repeat: false, done: false, createdAt: Date.now() }]]);
    $('#tText').value = '';
    toast('Buzdolabına yapıştırıldı ♡');
  };
  $('#heartForm').onsubmit = e => {
    e.preventDefault();
    if (!S) return;
    const v = Math.max(0, Math.min(9999, Math.round(Number($('#hVal').value))));
    if (Number.isNaN(v)) return;
    act([['hearts', v]]);
    $('#hVal').blur();
    toast(`Güzin'in kalbi artık ${v} ♡`);
  };
  document.addEventListener('click', e => {
    const un = e.target.closest('[data-unlock]');
    if (un && S) {
      const on = un.dataset.unlock === 'on';
      act([[`unlock.${dayKey(now())}`, on ? true : DEL]]);
      toast(on ? 'Bugün dekorasyon onun için açık 🎁' : 'Kilit normale döndü');
      return;
    }
    const rm = e.target.closest('[data-rm]');
    if (rm && S) {
      const key = rm.dataset.rm;
      clearTimeout(armT);
      if (armed === key) { armed = null; remove(key); return; }
      armed = key;
      armT = setTimeout(() => { armed = null; if (S) render(); }, 3000);
      render();
    }
  });
  $('#signInBtn').onclick = async () => {
    $('#loginErr').textContent = '';
    try { await store.signIn(); } catch (e) { onError(e); }
  };
  $('#switchBtn').onclick = () => store?.signOut();
}
