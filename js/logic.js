// Odanın kuralları: günler, notlar, kilit, mektuplar.

import { LOCAL_MODE } from './config.js';

export const pad = n => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Deneme için ?saat=21 ile saati değiştirmek sadece yerel modda çalışır.
const qs = new URLSearchParams(location.search);
const HOUR_OVERRIDE = LOCAL_MODE && qs.has('saat') ? Number(qs.get('saat')) : null;
export const now = () => {
  const d = new Date();
  if (HOUR_OVERRIDE !== null && !Number.isNaN(HOUR_OVERRIDE)) d.setHours(HOUR_OVERRIDE);
  return d;
};

export const POSTIT_COLORS = ['#fff3a6', '#ffd1e3', '#c9f0dd', '#cfe6ff', '#e4d6ff', '#ffd9b8'];

export const isDone = (t, day) => (t.repeat ? t.doneDay === day : !!t.done);

// Buzdolabında görünenler: bitmemişler + bugün bitenler + her gün tekrarlananlar.
export function fridgeList(S, day = dayKey(now())) {
  const all = Object.entries(S.todos || {}).map(([id, t]) => ({ id, ...t }));
  const vis = all.filter(t => t.repeat || !t.done || (t.doneAt && dayKey(new Date(t.doneAt)) === day));
  vis.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  return { open: vis.filter(t => !isDone(t, day)), doneToday: vis.filter(t => isDone(t, day)) };
}

// Dekorasyon: liste bitince VE akşam saatinde açılır. Deniz o gün için kilidi açabilir.
export function unlockInfo(S, d = now()) {
  const day = dayKey(d);
  const { open, doneToday } = fridgeList(S, day);
  const hour = S.settings?.eveningHour ?? 18;
  const listOk = open.length === 0;
  const timeOk = d.getHours() >= hour;
  const gift = !!S.unlock?.[day];
  return { day, open, doneToday, hour, listOk, timeOk, gift, unlocked: gift || (listOk && timeOk) };
}

// "saat 18:00'de", "saat 19:00'da", "saat 15:00'te" (Türkçe ek uyumu).
export function hourAt(h) {
  const u = h % 10;
  const word = u ? ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'][u] : (h === 10 ? 'on' : h === 20 ? 'yirmi' : 'sıfır');
  const v = [...word].reverse().find(c => 'aeıioöuü'.includes(c));
  const hard = 'fstkçşhp'.includes(word[word.length - 1]);
  return `saat ${h}:00'${hard ? 't' : 'd'}${'aıou'.includes(v) ? 'a' : 'e'}`;
}

// Kapıdaki "Do not disturb" tabelası. Unutulursa 12 saat sonra kendiliğinden düşer.
export const DND_MAX = 12 * 3600e3;
export const dndActive = (S, t = Date.now()) => !!(S?.dnd?.since && t - S.dnd.since < DND_MAX);
export function fmtDur(min) {
  if (min < 60) return `${min} dk`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} sa ${m} dk` : `${h} sa`;
}

// Sayaç: { dur: saniye, endAt: bitiş zamanı (çalışırken), left: kalan saniye (duraklatılmışken), label }
export const timerState = t => (t?.endAt ? 'run' : typeof t?.left === 'number' ? 'pause' : 'idle');
export function timerRemaining(t, at = Date.now()) {
  if (t?.endAt) return Math.max(0, Math.ceil((t.endAt - at) / 1000));
  if (typeof t?.left === 'number') return t.left;
  return t?.dur || 25 * 60;
}
export const mmss = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

// Çalışma geçmişi: tabela her kaldırıldığında bir kayıt; tabela asılıyken süren oturum da listede.
const GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const hm = ms => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const dayLabel = ms => { const d = new Date(ms); return `${d.getDate()} ${AY[d.getMonth()]} ${GUN[d.getDay()]}`; };
export function studySessions(S, t = Date.now()) {
  const list = Object.entries(S.studyLog || {})
    .map(([id, e]) => ({ id, start: e.start, end: e.end }))
    .filter(e => e.end > e.start);
  if (dndActive(S, t)) list.push({ id: null, start: S.dnd.since, end: t, current: true });
  return list.sort((a, b) => b.start - a.start);
}
export function studyTotals(sessions, t = Date.now()) {
  const today = dayKey(new Date(t));
  const weekAgo = t - 7 * 864e5;
  let d = 0, w = 0;
  for (const s of sessions) {
    const m = (s.end - s.start) / 60000;
    if (dayKey(new Date(s.start)) === today) d += m;
    if (s.start >= weekAgo) w += m;
  }
  return { today: Math.floor(d), week: Math.floor(w) };
}

export const BONUS_MIN = 3;
export const BONUS = 3;

export function visibleNotes(S, t = Date.now()) {
  return Object.entries(S.notes || {})
    .map(([id, n]) => ({ id, ...n }))
    .filter(n => (n.showAt || 0) <= t)
    .sort((a, b) => (b.showAt || 0) - (a.showAt || 0));
}
export const unreadNotes = (S, t = Date.now()) => visibleNotes(S, t).filter(n => !n.readAt);

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const fmtDate = ms => { const d = new Date(ms); return `${d.getDate()} ${AY[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const fmtDay = ms => { const d = new Date(ms); return `${d.getDate()} ${AY[d.getMonth()]}`; };

// Her post-it'in kendine has hafif eğikliği.
export function tilt(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (Math.abs(h) % 9) - 4;
}

export function skyPhase(d = now()) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h < 6.5 || h >= 19.5) return 'night';
  if (h < 8.5) return 'dawn';
  if (h < 17.5) return 'day';
  return 'sunset';
}

// Eski verilerde eksik alan kalmasın.
export function normalize(st) {
  const S = st || {};
  for (const k of ['placed', 'inventory', 'todos', 'notes', 'bonus', 'unlock', 'settings', 'stats', 'ownWall', 'ownFloor', 'studyLog']) {
    if (typeof S[k] !== 'object' || S[k] === null) S[k] = {};
  }
  if (typeof S.timer !== 'object' || S.timer === null) S.timer = {};
  if (!(S.timer.dur > 0)) S.timer.dur = 25 * 60;
  if (typeof S.hearts !== 'number') S.hearts = 0;
  S.wall ||= 'dots';
  S.floor ||= 'wood';
  S.ownWall.dots = true;
  S.ownFloor.wood = true;
  return S;
}
