// Odayı tek bir SVG olarak çizer. Hem Güzin'in sayfası hem Deniz paneli kullanır.

import { ITEMS, STAGE, ENVELOPE, defsSVG, artOf, itemOn } from './catalog.js';
import { skyPhase } from './logic.js';

const ORDER = { wall: 0, rug: 1, floor: 2, deco: 3 };

export function sortedPlaced(S) {
  const list = Object.entries(S.placed || {})
    .map(([pid, p]) => ({ pid, ...p, def: ITEMS[p.item] }))
    .filter(p => p.def);
  list.sort((a, b) => {
    const la = a.def.layer, lb = b.def.layer;
    if (la !== lb) return ORDER[la] - ORDER[lb];
    // Zemindeki eşyalarda aşağıda (öne yakın) olan önde çizilir.
    if (la === 'floor' || la === 'rug') return (a.y + a.def.h) - (b.y + b.def.h);
    return (a.z || 0) - (b.z || 0);
  });
  return list;
}

export function roomSVG(S, o = {}) {
  const { W, H, WALL } = STAGE;
  const now = o.now || new Date();
  const phase = skyPhase(now);
  const curtain = !!S.curtain;
  const lightOn = !!S.light;
  const ctx = { now, phase, postits: o.postits || [], dnd: !!o.dnd, swing: !!o.swing, curtain, light: lightOn };
  const placed = sortedPlaced(S);
  // Kedi gibi yerinde durmayan eşyaların o anki konumu/pozu (sadece ekranda, kaydedilmez).
  const ov = o.overrides || {};
  const trashN = Object.keys(S.trash || {}).length;

  const items = placed.map(p => {
    const d = p.def;
    const v = ov[p.pid] || {};
    const x = v.x ?? p.x, y = v.y ?? p.y, flip = v.flip ?? p.flip;
    const photos = d.photos ? (p.photos || []).map(id => (id && o.photoData?.[id]) || null) : undefined;
    const art = artOf(d, { ...ctx, on: itemOn(p, d), pid: p.pid, photos, trash: trashN, ...v });
    const inner = flip && !d.noFlip ? `<g transform="translate(${d.w} 0) scale(-1 1)">${art}</g>` : art;
    const hit = o.design ? `<rect class="hit" width="${d.w}" height="${d.h}" fill="transparent"/>` : '';
    const sel = o.selected === p.pid ? `<rect class="sel-outline" x="-8" y="-8" width="${d.w + 16}" height="${d.h + 16}" rx="14"/>` : '';
    return `<g class="it it-${p.item}${v.pose ? ' pose-' + v.pose : ''}" data-pid="${p.pid}" data-item="${p.item}" transform="translate(${x} ${y})">${hit}<g class="art">${inner}</g>${sel}</g>`;
  }).join('');

  // Aydınlık: gün ışığı (perde kapalıysa azalır) ya da tavan ışığı, hangisi fazlaysa.
  const sun = phase === 'day' ? 1 : phase === 'night' ? 0 : .55;
  const lit = Math.max(curtain ? sun * .3 : sun, lightOn ? .92 : 0);
  const dark = 1 - lit;
  let light = '';
  if (dark > .04) light += `<rect width="${W}" height="${H}" fill="#1e1640" opacity="${(dark * .4).toFixed(2)}" pointer-events="none"/>`;
  if (lightOn) light += `<rect width="${W}" height="${H}" fill="#ffc978" opacity=".07" pointer-events="none"/>`;
  else if (!curtain && phase === 'sunset') light += `<rect width="${W}" height="${H}" fill="#ff8a5c" opacity=".07" pointer-events="none"/>`;
  else if (!curtain && phase === 'dawn') light += `<rect width="${W}" height="${H}" fill="#ffb3c8" opacity=".06" pointer-events="none"/>`;
  // Yanan lambalar ışık saçar; oda karanlıksa güçlü, aydınlıksa hafif (açık olduğu belli olsun).
  const glowOp = dark > .3 ? Math.min(1, .35 + (dark - .3) * 1.3) : .22;
  const glows = placed.filter(p => p.def.glow && itemOn(p, p.def)).flatMap(p => p.def.glow.map(g => {
    const gx = p.flip && !p.def.noFlip ? p.def.w - g.cx : g.cx;
    return `<circle cx="${p.x + gx}" cy="${p.y + g.cy}" r="${g.r}" fill="url(#${g.c || 'glow'})"/>`;
  })).join('');
  if (glows) light += `<g class="glows" pointer-events="none" opacity="${glowOp.toFixed(2)}">${glows}</g>`;

  let env = '';
  if (o.unread) {
    const door = placed.find(p => p.item === 'door');
    const ex = door ? door.x + (door.def.w - ENVELOPE.w) / 2 : 860;
    const ey = door ? door.y + door.def.h - ENVELOPE.h + 18 : 800;
    env = `<g class="envelope" data-act="mail" transform="translate(${Math.round(ex)} ${Math.round(ey)})"><g class="env-bob art">${ENVELOPE.art}</g></g>`;
  }

  return `<defs>${defsSVG()}<clipPath id="roomclip"><rect width="${W}" height="${H}" rx="40"/></clipPath></defs>
  <g clip-path="url(#roomclip)">
    <rect width="${W}" height="${WALL}" fill="url(#wp-${S.wall || 'dots'})"/>
    <rect width="${W}" height="${WALL}" fill="url(#wallShade)"/>
    <rect y="${WALL}" width="${W}" height="${H - WALL}" fill="url(#fl-${S.floor || 'wood'})"/>
    <rect y="${WALL}" width="${W}" height="60" fill="url(#floorShade)"/>
    <rect x="-4" y="${WALL - 12}" width="${W + 8}" height="16" fill="#fff" stroke="#6b3d52" stroke-width="3"/>
    ${items}
    ${light}
    ${env}
  </g>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="39" fill="none" stroke="#6b3d52" stroke-width="3" pointer-events="none"/>`;
}
