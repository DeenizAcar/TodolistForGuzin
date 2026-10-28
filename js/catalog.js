// Odanın eşyaları, duvar kağıtları ve zeminleri. Hepsi elle çizilmiş SVG.
// Her eşya kendi kutusunda (0..w, 0..h) çizilir. Kontur rengi ve kalınlığı CSS'ten gelir
// (.art *), konturu olmasın istenen parçalar "ns", ince olanlar "thin" sınıfı alır.

export const STAGE = { W: 1000, H: 900, WALL: 610 };

export const C = {
  ink: '#6b3d52', pink: '#f9a8c7', pinkL: '#ffd6e5', rose: '#ec6f9d', blush: '#f58fb5', red: '#f2607f',
  cream: '#fff4e6', wood: '#e0a872', woodD: '#c98a55', woodL: '#f6dcb6',
  mint: '#bfe8d6', mintD: '#8fd3b6', lilac: '#d9c8ff', lilacD: '#c7b2fa',
  blue: '#bfe0ff', yellow: '#ffe08a', peach: '#ffc9a8', green: '#8fd18a', greenD: '#5fae6a',
};

const r1 = v => Math.round(v * 10) / 10;

// Kalp: üst ortası (x, y), genişliği s.
export function heart(x, y, s) {
  const p = (a, b) => `${r1(x + a * s)} ${r1(y + b * s)}`;
  return `M${p(0, .25)}C${p(-.05, -.05)} ${p(-.5, -.05)} ${p(-.5, .3)}C${p(-.5, .55)} ${p(-.15, .7)} ${p(0, .9)}`
    + `C${p(.15, .7)} ${p(.5, .55)} ${p(.5, .3)}C${p(.5, -.05)} ${p(.05, -.05)} ${p(0, .25)}Z`;
}

// Dört köşeli parıltı.
export function star(x, y, s) {
  const k = s * .3;
  return `M${x} ${y - s}L${r1(x + k)} ${r1(y - k)}L${x + s} ${y}L${r1(x + k)} ${r1(y + k)}L${x} ${y + s}L${r1(x - k)} ${r1(y + k)}L${x - s} ${y}L${r1(x - k)} ${r1(y - k)}Z`;
}

function cloud(x, y, s = 1, fill = '#fff') {
  return `<g class="ns" transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="0" r="14" fill="${fill}"/><circle cx="17" cy="-7" r="18" fill="${fill}"/><circle cx="36" cy="0" r="13" fill="${fill}"/><rect x="0" y="-2" width="36" height="15" fill="${fill}"/></g>`;
}

const qpt = (a, b, c, t) => [0, 1].map(i => r1((1 - t) ** 2 * a[i] + 2 * (1 - t) * t * b[i] + t * t * c[i]));

/* ---------- Sabit eşyalar ---------- */

function fridgeArt({ postits = [] } = {}) {
  const cells = [[38, 152], [84, 150], [40, 200], [86, 202], [38, 248], [84, 250]];
  const rots = [-6, 5, 4, -5, -3, 6];
  let notes = '';
  if (postits.length) {
    postits.slice(0, 6).forEach((col, i) => {
      const [cx, cy] = cells[i];
      notes += `<g transform="translate(${cx} ${cy}) rotate(${rots[i]})"><rect class="thin" x="-19" y="-19" width="38" height="38" rx="3" fill="${col}"/>`
        + `<path d="M-11 -3H11M-11 5H6" fill="none" style="stroke-width:2;opacity:.35"/><circle class="ns" cy="-15" r="4.5" fill="${C.rose}"/></g>`;
    });
  } else {
    notes = `<path d="${heart(62, 178, 44)}" fill="${C.rose}"/><path class="ns" d="${star(98, 170, 7)}" fill="#fff"/>`;
  }
  return `
  <rect x="18" y="280" width="18" height="16" rx="5" fill="${C.woodD}"/>
  <rect x="114" y="280" width="18" height="16" rx="5" fill="${C.woodD}"/>
  <rect x="4" y="4" width="142" height="282" rx="30" fill="#ffdce8"/>
  <path d="M4 112H146" fill="none"/>
  <rect class="ns" x="20" y="16" width="34" height="9" rx="4.5" fill="#fff" opacity=".8"/>
  <rect x="122" y="40" width="10" height="48" rx="5" fill="#fff"/>
  <rect x="122" y="128" width="10" height="70" rx="5" fill="#fff"/>
  <circle class="ns" cx="50" cy="60" r="5.5" fill="${C.ink}"/><circle class="ns" cx="86" cy="60" r="5.5" fill="${C.ink}"/>
  <circle class="ns" cx="52" cy="58" r="1.8" fill="#fff"/><circle class="ns" cx="88" cy="58" r="1.8" fill="#fff"/>
  <path d="M60 70Q68 78 76 70" fill="none"/>
  <ellipse class="ns" cx="38" cy="74" rx="9" ry="5.5" fill="${C.blush}" opacity=".55"/>
  <ellipse class="ns" cx="98" cy="74" rx="9" ry="5.5" fill="${C.blush}" opacity=".55"/>
  ${notes}`;
}

// Kapalı perde: iki kanat camı tamamen örter, aralarından ince bir ışık sızar.
function closedCurtains() {
  const folds = x => `M${x} 14C${x + 3} 80 ${x - 3} 150 ${x} 220`;
  return `
  <path d="M6 10H138V222C124 228 112 223 98 228C84 223 72 228 58 223C44 228 30 223 18 228C12 226 8 224 6 222Z" fill="${C.pink}"/>
  <path d="${folds(34)}${folds(64)}${folds(96)}${folds(122)}" fill="none" class="thin" style="opacity:.45"/>
  <path d="M264 10H132V222C146 228 158 223 172 228C186 223 198 228 212 223C226 228 240 223 252 228C258 226 262 224 264 222Z" fill="${C.pink}"/>
  <path d="${folds(148)}${folds(176)}${folds(206)}${folds(236)}" fill="none" class="thin" style="opacity:.45"/>
  <path class="ns" d="${heart(135, 100, 22)}" fill="${C.rose}"/>`;
}

function windowArt({ phase = 'day', curtain = false } = {}) {
  let deco = '';
  if (phase === 'day') deco = `<circle class="ns" cx="188" cy="72" r="20" fill="${C.yellow}"/>${cloud(78, 84)}${cloud(150, 156, .7)}`;
  else if (phase === 'dawn') deco = `<circle class="ns" cx="96" cy="176" r="24" fill="#ffd27a"/>${cloud(150, 80, .8, '#fff7fb')}`;
  else if (phase === 'sunset') deco = `<circle class="ns" cx="172" cy="182" r="28" fill="#ffb06b"/>${cloud(70, 90, .9, '#ffe0e8')}`;
  else {
    deco = `<circle class="ns" cx="182" cy="74" r="20" fill="#fff6c9"/><circle class="ns" cx="193" cy="66" r="18" fill="url(#sky-night)"/>`
      + [[70, 60, 6], [104, 96, 4], [60, 150, 5], [150, 168, 4], [204, 140, 5], [120, 54, 3]].map(([x, y, s]) => `<path class="ns" d="${star(x, y, s)}" fill="#fff6c9"/>`).join('');
  }
  return `
  <defs><clipPath id="winclip"><rect x="44" y="34" width="182" height="166" rx="8"/></clipPath></defs>
  <rect x="30" y="20" width="210" height="194" rx="16" fill="#fff"/>
  <rect x="44" y="34" width="182" height="166" rx="8" fill="url(#sky-${phase})"/>
  <g clip-path="url(#winclip)">${deco}</g>
  <rect x="130" y="34" width="10" height="166" fill="#fff"/>
  <rect x="44" y="112" width="182" height="10" fill="#fff"/>
  <rect x="18" y="204" width="234" height="18" rx="8" fill="#fff"/>
  ${curtain ? closedCurtains() : `
  <path d="M6 10H62C58 60 40 120 36 150C44 180 52 205 54 226H6Z" fill="${C.pink}"/>
  <path d="M20 14C22 60 20 110 18 146M18 162C22 190 26 210 26 222" fill="none" class="thin" style="opacity:.5"/>
  <rect x="2" y="142" width="40" height="13" rx="6" fill="${C.rose}"/>
  <path d="M264 10H208C212 60 230 120 234 150C226 180 218 205 216 226H264Z" fill="${C.pink}"/>
  <path d="M250 14C248 60 250 110 252 146M252 162C248 190 244 210 244 222" fill="none" class="thin" style="opacity:.5"/>
  <rect x="228" y="142" width="40" height="13" rx="6" fill="${C.rose}"/>`}
  <rect x="0" y="3" width="270" height="11" rx="5.5" fill="${C.wood}"/>`;
}

// Kapıdaki tabela: dokununca "Güzin" ile "DO NOT DISTURB" arasında döner.
// Kapının solundaki duvarda ışık düğmesi (açıkken üst taraf basılı ve sarı).
function lightSwitch(on) {
  return `<g class="light-switch" data-act="light" transform="translate(-50 168)">
    <rect class="ns" x="-10" y="-10" width="56" height="74" fill="transparent"/>
    <rect x="0" y="0" width="36" height="54" rx="9" fill="#fff"/>
    <rect x="10" y="9" width="16" height="36" rx="6" fill="${on ? C.yellow : '#f3e6ec'}" class="thin"/>
    <rect x="12" y="${on ? 11 : 27}" width="12" height="16" rx="4.5" fill="${on ? '#fff6c9' : '#fff'}" class="thin"/>
  </g>`;
}

function doorArt({ dnd = false, swing = false, light = false } = {}) {
  const font = 'font-family="Nunito, sans-serif" font-weight="800" text-anchor="middle"';
  const sign = dnd
    ? `<path d="M50 50L85 28L120 50" fill="none" class="thin"/>
       <rect x="26" y="48" width="118" height="54" rx="14" fill="${C.rose}"/>
       <text x="85" y="71" font-size="16" letter-spacing="1" fill="#fff" ${font}>DO NOT</text>
       <text x="85" y="91" font-size="16" letter-spacing="1" fill="#fff" ${font}>DISTURB</text>
       <path class="ns" d="${star(38, 60, 5)}" fill="#fff" opacity=".8"/>
       <path class="ns" d="${star(132, 92, 4)}" fill="#fff" opacity=".8"/>`
    : `<path d="M58 52L85 28L112 52" fill="none" class="thin"/>
       <rect x="40" y="50" width="90" height="38" rx="13" fill="#fff4f8"/>
       <text x="85" y="76" font-size="20" fill="${C.rose}" ${font}>Güzin</text>
       <path class="ns" d="${heart(85, 100, 18)}" fill="${C.pink}"/>`;
  return `
  <rect x="4" y="4" width="162" height="374" rx="12" fill="#fff"/>
  <rect x="18" y="18" width="134" height="360" rx="8" fill="#e9b98d"/>
  <rect x="34" y="40" width="102" height="118" rx="10" fill="#f2cf9f"/>
  <rect x="34" y="182" width="102" height="170" rx="10" fill="#f2cf9f"/>
  <circle cx="134" cy="200" r="9" fill="${C.yellow}"/>
  <g class="door-sign${swing ? ' swing' : ''}" data-act="sign">
    <rect class="ns" x="22" y="20" width="126" height="102" fill="transparent"/>
    ${sign}
    <circle class="ns" cx="85" cy="28" r="3.5" fill="${C.ink}"/>
  </g>
  ${lightSwitch(light)}`;
}

/* ---------- Mobilyalar ---------- */

const bedArt = `
  <rect x="50" y="176" width="14" height="20" rx="4" fill="${C.woodD}"/>
  <rect x="300" y="176" width="14" height="20" rx="4" fill="${C.woodD}"/>
  <rect x="6" y="20" width="48" height="168" rx="22" fill="${C.wood}"/>
  <path class="ns" d="${heart(30, 52, 22)}" fill="${C.pinkL}"/>
  <rect x="40" y="148" width="280" height="34" rx="10" fill="${C.wood}"/>
  <rect x="44" y="110" width="276" height="46" rx="18" fill="#fff"/>
  <ellipse cx="98" cy="104" rx="44" ry="22" fill="${C.cream}"/>
  <path d="M128 92H300V160H152C136 160 128 150 128 136Z" fill="${C.pink}"/>
  <path class="ns" d="${heart(184, 106, 18)}" fill="#fff" opacity=".8"/>
  <path class="ns" d="${heart(240, 122, 14)}" fill="#fff" opacity=".8"/>
  <path class="ns" d="${heart(282, 100, 12)}" fill="#fff" opacity=".8"/>
  <path d="M128 104H300" fill="none" class="thin" style="opacity:.4"/>
  <rect x="300" y="96" width="54" height="92" rx="18" fill="${C.wood}"/>`;

const deskArt = `
  <rect x="18" y="20" width="12" height="142" rx="5" fill="${C.wood}"/>
  <rect x="158" y="20" width="90" height="142" rx="8" fill="${C.wood}"/>
  <rect x="170" y="34" width="66" height="50" rx="7" fill="${C.woodL}"/>
  <rect x="170" y="96" width="66" height="54" rx="7" fill="${C.woodL}"/>
  <rect x="194" y="54" width="18" height="8" rx="4" fill="#fff"/>
  <rect x="194" y="118" width="18" height="8" rx="4" fill="#fff"/>
  <rect x="4" y="6" width="252" height="20" rx="8" fill="#f8e3c4"/>`;

const chairArt = `
  <rect x="22" y="90" width="10" height="76" rx="4" fill="${C.wood}"/>
  <rect x="78" y="90" width="10" height="76" rx="4" fill="${C.wood}"/>
  <rect x="18" y="6" width="74" height="84" rx="26" fill="${C.wood}"/>
  <rect x="28" y="16" width="54" height="64" rx="19" fill="${C.pinkL}"/>
  <path class="ns" d="${heart(55, 36, 22)}" fill="${C.pink}"/>
  <rect x="8" y="84" width="94" height="22" rx="10" fill="${C.pink}"/>`;

const armchairArt = `
  <rect x="34" y="150" width="12" height="16" rx="4" fill="${C.woodD}"/>
  <rect x="174" y="150" width="12" height="16" rx="4" fill="${C.woodD}"/>
  <rect x="26" y="8" width="168" height="112" rx="44" fill="${C.lilac}"/>
  <rect x="34" y="128" width="152" height="26" rx="10" fill="${C.lilacD}"/>
  <path d="${heart(110, 36, 50)}" fill="${C.pink}"/>
  <rect x="44" y="96" width="132" height="42" rx="16" fill="#ebe2ff"/>
  <rect x="4" y="66" width="52" height="88" rx="24" fill="${C.lilacD}"/>
  <rect x="164" y="66" width="52" height="88" rx="24" fill="${C.lilacD}"/>`;

const bookshelfArt = `
  <rect x="6" y="4" width="158" height="292" rx="10" fill="${C.wood}"/>
  <rect x="18" y="16" width="134" height="82" rx="4" fill="${C.woodL}"/>
  <rect x="18" y="108" width="134" height="82" rx="4" fill="${C.woodL}"/>
  <rect x="18" y="200" width="134" height="82" rx="4" fill="${C.woodL}"/>
  <rect class="thin" x="26" y="38" width="16" height="60" rx="2" fill="${C.pink}"/>
  <rect class="thin" x="42" y="30" width="14" height="68" rx="2" fill="${C.blue}"/>
  <rect class="thin" x="56" y="44" width="16" height="54" rx="2" fill="${C.mint}"/>
  <rect class="thin" x="76" y="50" width="14" height="48" rx="2" fill="${C.lilac}" transform="rotate(16 90 98)"/>
  <ellipse class="thin" cx="122" cy="64" rx="7" ry="12" fill="${C.green}" transform="rotate(-25 122 64)"/>
  <ellipse class="thin" cx="134" cy="62" rx="7" ry="12" fill="${C.green}" transform="rotate(25 134 62)"/>
  <path class="thin" d="M112 74H142L138 98H116Z" fill="${C.peach}"/>
  <rect class="thin" x="26" y="172" width="62" height="18" rx="2" fill="${C.yellow}"/>
  <rect class="thin" x="32" y="155" width="52" height="17" rx="2" fill="${C.pink}"/>
  <rect class="thin" x="104" y="148" width="36" height="42" rx="9" fill="#eaf6ff"/>
  <path class="ns" d="${heart(122, 160, 18)}" fill="${C.rose}"/>
  <rect class="thin" x="28" y="234" width="114" height="48" rx="10" fill="${C.cream}"/>
  <path d="M40 246H130M40 258H130M40 270H130" fill="none" class="thin" style="opacity:.35"/>
  <path class="ns" d="${heart(85, 244, 20)}" fill="${C.pink}"/>`;

const nightstandArt = `
  <rect x="16" y="104" width="10" height="18" rx="3" fill="${C.woodD}"/>
  <rect x="90" y="104" width="10" height="18" rx="3" fill="${C.woodD}"/>
  <rect x="6" y="10" width="104" height="98" rx="10" fill="${C.cream}"/>
  <rect x="18" y="24" width="80" height="32" rx="6" fill="${C.pinkL}"/>
  <rect x="18" y="64" width="80" height="32" rx="6" fill="${C.pinkL}"/>
  <circle cx="58" cy="40" r="4" fill="#fff"/><circle cx="58" cy="80" r="4" fill="#fff"/>
  <rect x="2" y="4" width="112" height="12" rx="5" fill="#fff"/>`;

const poufArt = `
  <rect x="6" y="20" width="104" height="56" rx="24" fill="#efd6fb"/>
  <path d="M30 32Q26 52 30 72M58 36V74M86 32Q90 52 86 72" fill="none" class="thin" style="opacity:.45"/>
  <ellipse cx="58" cy="22" rx="52" ry="14" fill="#f8ecfe"/>
  <circle class="ns" cx="58" cy="22" r="4" fill="${C.lilacD}"/>`;

// Açılıp kapanabilen eşyalarda yanarken kullanılan renk.
const LIT = '#fff3c4';

const floorLampArt = ({ on = true } = {}) => `
  <ellipse cx="45" cy="280" rx="32" ry="8" fill="${C.woodD}"/>
  <rect x="41" y="66" width="8" height="212" rx="4" fill="#fff"/>
  <path d="M16 76L28 8H62L74 76Z" fill="${on ? LIT : C.pinkL}"/>
  <path d="M22 44H68" fill="none" class="thin" style="stroke-dasharray:4 5"/>
  <path d="M44 76V96" fill="none" class="thin"/><circle class="thin" cx="44" cy="99" r="3" fill="${C.rose}"/>`;

const monsteraArt = (() => {
  const leaf = (cx, cy, rx, ry, rot, fill) => `<g transform="translate(${cx} ${cy}) rotate(${rot})"><ellipse rx="${rx}" ry="${ry}" fill="${fill}"/><path d="M${-rx + 5} 0H${rx - 5}" fill="none" class="thin" style="stroke:${C.greenD}"/></g>`;
  return `
  <path d="M70 152C66 120 50 96 32 72M70 152C72 112 88 86 106 60M70 152C70 120 70 80 70 34M70 152C60 136 50 126 40 118M70 152C82 136 92 124 102 114" fill="none" style="stroke:${C.greenD}"/>
  ${leaf(32, 72, 30, 18, -35, C.green)}${leaf(106, 60, 30, 18, 30, '#a3dc9e')}${leaf(70, 34, 28, 17, 90, C.green)}
  ${leaf(40, 118, 26, 15, -15, '#a3dc9e')}${leaf(102, 114, 26, 15, 20, C.green)}
  <rect x="34" y="146" width="72" height="14" rx="6" fill="${C.pink}"/>
  <path d="M38 160H102L95 214H45Z" fill="${C.cream}"/>
  <circle class="ns" cx="60" cy="182" r="3" fill="${C.ink}"/><circle class="ns" cx="80" cy="182" r="3" fill="${C.ink}"/>
  <path d="M65 190Q70 194 75 190" fill="none" class="thin"/>`;
})();

/* ---------- Halılar ---------- */

const rugRoundArt = `
  <ellipse cx="160" cy="38" rx="155" ry="33" fill="#f9d3e1"/>
  <ellipse cx="160" cy="38" rx="122" ry="23" fill="#fde8f0" class="thin" style="stroke-dasharray:7 7"/>
  <g transform="translate(160 26) scale(1 .5)"><path class="ns" d="${heart(0, 0, 34)}" fill="${C.pink}"/></g>`;

const rugStripeArt = `
  <path d="M34 4H292L266 60H8Z" fill="${C.mint}"/>
  <path class="ns" d="M70 4H96L72 60H46ZM140 4H166L142 60H116ZM210 4H236L212 60H186Z" fill="#fff" opacity=".65"/>
  <path d="M34 4H292L266 60H8Z" fill="none"/>`;

const rugHeartArt = `
  <g transform="translate(125 2) scale(1 .38)">
    <path d="${heart(0, 0, 236)}" fill="#ffc2d6" style="vector-effect:non-scaling-stroke"/>
    <path d="${heart(0, 34, 170)}" fill="none" class="thin" style="vector-effect:non-scaling-stroke;stroke-dasharray:7 7"/>
  </g>`;

/* ---------- Duvar süsleri ---------- */

// Fotoğraf yuvası: verilen kutuya fotoğrafı kırparak yerleştirir.
function photoSlot(pid, i, x, y, w, h, src) {
  const id = `ph-${String(pid).replace(/[^a-z0-9_-]/gi, '')}-${i}`;
  return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/></clipPath></defs>
    <image href="${src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
}

const paintingArt = ({ photos = [], pid = 'x' } = {}) => `
  <rect x="4" y="4" width="152" height="116" rx="8" fill="${C.wood}"/>
  ${photos[0] ? `<rect x="16" y="16" width="128" height="92" rx="3" fill="#fff"/>${photoSlot(pid, 0, 16, 16, 128, 92, photos[0])}<rect x="16" y="16" width="128" height="92" rx="3" fill="none" class="thin"/>` : `
  <rect x="16" y="16" width="128" height="92" rx="3" fill="#d4ecff"/>
  <path class="ns" d="M17 86C40 62 66 62 90 84C106 72 126 70 143 80V107H17Z" fill="#a8dea3"/>
  <path class="ns" d="M17 98C50 84 90 90 143 96V107H17Z" fill="${C.green}"/>
  <path d="${heart(108, 26, 28)}" fill="${C.pink}" class="thin"/>
  ${cloud(32, 44, .6)}`}`;

const posterArt = `
  <rect x="6" y="8" width="112" height="150" rx="4" fill="#fff"/>
  <rect class="ns" x="16" y="18" width="92" height="104" rx="2" fill="${C.pinkL}"/>
  <path d="M62 112V70" fill="none" style="stroke:${C.greenD}"/>
  <path class="thin" d="M62 102C48 100 42 90 44 82C54 84 60 92 62 102Z" fill="${C.green}"/>
  <path class="thin" d="M62 94C76 92 82 82 80 74C70 76 64 84 62 94Z" fill="${C.green}"/>
  <path d="M48 50L54 60L62 48L70 60L76 50C78 68 72 76 62 76C52 76 46 68 48 50Z" fill="${C.rose}"/>
  <path d="M30 136H94M40 146H84" fill="none" class="thin" style="opacity:.5"/>
  <rect class="ns" x="45" y="0" width="34" height="14" rx="2" fill="#fff4b8" opacity=".9" transform="rotate(-5 62 7)"/>`;

const mirrorArt = `
  <path d="M8 172V58A48 48 0 0 1 104 58V172Z" fill="${C.yellow}"/>
  <path d="M20 160V60A36 36 0 0 1 92 60V160Z" fill="#dff1ff"/>
  <path d="M36 78L60 54M36 104L74 66" fill="none" style="stroke:#fff;stroke-width:7"/>
  <path class="ns" d="${heart(56, 3, 16)}" fill="${C.rose}"/>`;

// Duvar rafı: kitaplar (dokununca klasör) ve mum (dokununca yanar/söner) ayrı ayrı tıklanır.
const shelfArt = ({ on = true } = {}) => `
  <path d="M30 70H50L30 84Z" fill="${C.woodD}"/>
  <path d="M180 70H160L180 84Z" fill="${C.woodD}"/>
  <g data-act="books" class="hot">
    <rect class="ns" x="14" y="10" width="50" height="48" fill="transparent"/>
    <rect class="thin" x="20" y="22" width="13" height="34" rx="2" fill="${C.pink}"/>
    <rect class="thin" x="33" y="16" width="12" height="40" rx="2" fill="${C.blue}"/>
    <rect class="thin" x="45" y="26" width="13" height="30" rx="2" fill="${C.yellow}"/>
  </g>
  <g data-act="candle" class="hot">
    <rect class="ns" x="80" y="2" width="38" height="56" fill="transparent"/>
    <rect x="86" y="30" width="26" height="26" rx="7" fill="${C.cream}"/>
    <path d="M99 30V24" fill="none" class="thin"/>
    ${on ? `<path class="ns flame" d="M99 24Q93 16 99 8Q105 16 99 24Z" fill="#ffb36b"/>` : ''}
  </g>
  <ellipse class="thin" cx="157" cy="30" rx="6" ry="11" fill="${C.green}" transform="rotate(-25 157 30)"/>
  <ellipse class="thin" cx="170" cy="28" rx="6" ry="11" fill="${C.green}" transform="rotate(25 170 28)"/>
  <path class="thin" d="M150 38H176L172 56H154Z" fill="${C.mint}"/>
  <rect x="4" y="56" width="202" height="14" rx="5" fill="${C.wood}"/>`;

const BULB = [C.yellow, C.pink, C.mint, C.lilac, C.blue];
const FAIRY_PTS = [[[8, 10], [106, 54], [210, 16]], [[210, 16], [314, 54], [412, 10]]]
  .flatMap(s => [.14, .32, .5, .68, .86].map(t => qpt(...s, t)));
const fairyArt = ({ on = true } = {}) => `<path d="M8 10Q106 54 210 16Q314 54 412 10" fill="none" class="thin"/>`
  + FAIRY_PTS.map(([x, y], i) => `<g transform="translate(${x} ${y})"><rect class="ns" x="-3.5" y="-1" width="7" height="7" rx="1.5" fill="${C.ink}"/><ellipse class="thin${on ? ' twinkle' : ''}" cx="0" cy="13" rx="7" ry="9" fill="${on ? BULB[i % 5] : '#ece6ea'}" style="animation-delay:${(i % 5) * .3}s"/></g>`).join('');

const GAR = [[6, 10], [190, 46], [374, 10]];
const garlandArt = `<path d="M6 10Q190 46 374 10" fill="none" class="thin"/>` + Array.from({ length: 9 }, (_, i) => {
  const t0 = .06 + i * .1, a = qpt(...GAR, t0), b = qpt(...GAR, t0 + .08);
  const tip = [r1((a[0] + b[0]) / 2), r1((a[1] + b[1]) / 2 + 36)];
  return `<path class="thin" d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${tip[0]} ${tip[1]}Z" fill="${[C.pink, C.yellow, C.mint, C.lilac, C.blue][i % 5]}"/>`;
}).join('');

const POL = [[4, 12], [190, 46], [376, 12]];
const POLAROIDS = [
  [.18, -6, C.pinkL, `<path class="ns" d="${heart(0, 18, 28)}" fill="${C.rose}"/>`],
  [.39, 4, C.blue, `<circle class="ns" cx="0" cy="27" r="10" fill="${C.yellow}"/><path class="ns" d="M-24 54Q-4 34 24 54Z" fill="#a8dea3"/>`],
  [.61, -3, C.mint, [0, 72, 144, 216, 288].map(a => `<circle class="ns" cx="${r1(Math.sin(a * Math.PI / 180) * 9)}" cy="${r1(31 - Math.cos(a * Math.PI / 180) * 9)}" r="6.5" fill="#fff"/>`).join('') + `<circle class="ns" cx="0" cy="31" r="5" fill="${C.yellow}"/>`],
  [.82, 6, C.lilac, `<circle class="ns" cx="-8" cy="27" r="3" fill="${C.ink}"/><circle class="ns" cx="8" cy="27" r="3" fill="${C.ink}"/><path d="M-8 36Q0 43 8 36" fill="none" class="thin"/>`],
];
const polaroidArt = ({ photos = [], pid = 'x' } = {}) => `<path d="M4 12Q190 46 376 12" fill="none" class="thin"/>` + POLAROIDS.map(([t, rot, col, icon], i) => {
  const [x, y] = qpt(...POL, t);
  const inner = photos[i] ? photoSlot(pid, i, -24, 8, 48, 46, photos[i]) : `<rect class="ns" x="-24" y="8" width="48" height="46" fill="${col}"/>${icon}`;
  return `<g transform="translate(${x} ${y - 2}) rotate(${rot})"><rect x="-30" y="2" width="60" height="72" rx="3" fill="#fff"/>${inner}<rect class="thin" x="-4" y="-8" width="8" height="18" rx="2" fill="${C.wood}"/></g>`;
}).join('');

// Saat: akrep, yelkovan ve saniye ibresi. Sayfa her saniye ibreleri döndürür (clockAngles).
export const clockAngles = d => {
  const s = d.getSeconds(), m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
  return { h: r1(h * 30), m: r1(m * 6), s: s * 6 };
};
function clockArt({ now = new Date() } = {}) {
  const a = clockAngles(now);
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = i * Math.PI / 6, big = i % 3 === 0;
    return `<circle class="ns" cx="${r1(52 + Math.sin(a) * 31)}" cy="${r1(52 - Math.cos(a) * 31)}" r="${big ? 3 : 1.8}" fill="${big ? C.rose : C.ink}"/>`;
  }).join('');
  return `
  <circle cx="52" cy="52" r="48" fill="${C.pink}"/>
  <circle cx="52" cy="52" r="38" fill="#fff"/>${ticks}
  <path class="clock-h" d="M52 52V32" fill="none" style="stroke-width:5" transform="rotate(${a.h} 52 52)"/>
  <path class="clock-m" d="M52 52V24" fill="none" transform="rotate(${a.m} 52 52)"/>
  <path class="clock-s" d="M52 60V20" fill="none" style="stroke:${C.rose};stroke-width:1.8" transform="rotate(${a.s} 52 52)"/>
  <circle cx="52" cy="52" r="4" fill="${C.rose}"/>`;
}

/* ---------- Küçük süsler (her şeyin üstüne konabilir) ---------- */

const deskLampArt = ({ on = true } = {}) => `
  <ellipse cx="30" cy="88" rx="24" ry="7" fill="${C.mintD}"/>
  <path d="M30 86L22 52L46 30" fill="none" style="stroke-width:6"/>
  <circle cx="22" cy="52" r="5" fill="${C.mint}"/>
  ${on ? `<path class="ns" d="M76 30L52 46L58 50L80 36Z" fill="${LIT}"/>` : ''}
  <path d="M38 18Q62 4 76 30L52 46Z" fill="${C.mint}"/>
  <circle class="thin" cx="30" cy="86" r="3" fill="${on ? C.yellow : '#fff'}"/>`;

const smallPlantArt = `
  <ellipse class="thin" cx="32" cy="32" rx="10" ry="17" fill="${C.green}"/>
  <ellipse class="thin" cx="19" cy="38" rx="9" ry="14" fill="#a8dea3" transform="rotate(-35 19 38)"/>
  <ellipse class="thin" cx="45" cy="38" rx="9" ry="14" fill="#a8dea3" transform="rotate(35 45 38)"/>
  <path d="M12 46H52L47 78H17Z" fill="${C.peach}"/>
  <path class="ns" d="${heart(32, 54, 14)}" fill="#fff" opacity=".8"/>`;

const catSleepArt = `
  <g class="cat-tail"><path d="M100 82C130 82 130 50 112 46" fill="none" style="stroke-width:14"/><path d="M100 82C130 82 130 50 112 46" fill="none" style="stroke:#ffd3a8;stroke-width:8"/></g>
  <path d="M14 38L16 8L38 28Z" fill="#ffd3a8"/>
  <path d="M40 26L54 4L62 34Z" fill="#ffd3a8"/>
  <path class="ns" d="M19 32L20 16L31 27Z" fill="${C.blush}" opacity=".7"/>
  <path class="ns" d="M45 26L53 13L57 31Z" fill="${C.blush}" opacity=".7"/>
  <ellipse cx="70" cy="70" rx="50" ry="26" fill="#ffd3a8"/>
  <circle cx="36" cy="52" r="26" fill="#ffd3a8"/>
  <path d="M78 46Q83 54 78 60M94 48Q99 56 94 62" fill="none" class="thin" style="stroke:#f0a96a"/>
  <path d="M22 52Q27 57 32 52M40 52Q45 57 50 52" fill="none" class="thin"/>
  <path class="ns" d="M33 59H39L36 62Z" fill="${C.blush}"/>
  <ellipse class="ns" cx="20" cy="62" rx="6" ry="3.5" fill="${C.blush}" opacity=".6"/>
  <ellipse class="ns" cx="52" cy="62" rx="6" ry="3.5" fill="${C.blush}" opacity=".6"/>
  <ellipse class="thin" cx="54" cy="92" rx="12" ry="6" fill="#ffd3a8"/>
  <ellipse class="thin" cx="82" cy="94" rx="12" ry="6" fill="#ffd3a8"/>
  <text class="zzz" x="70" y="24" font-size="18" font-weight="800" fill="#a7748b" font-family="Nunito, sans-serif">z</text>
  <text class="zzz z2" x="84" y="12" font-size="13" font-weight="800" fill="#a7748b" font-family="Nunito, sans-serif">z</text>`;

// Kedinin diğer pozları (aynı 132×100 kutuda, böylece pozlar arasında yer değiştirmez).
const CAT = '#ffd3a8', CAT_D = '#f0a96a', CAT_L = '#fff1e0', CAT_FAR = '#f5c193';

// Oturan kedi: göz kırpar, gözleri fareye bakar (look = [dx, dy]); mutluyken gözleri ^^ olur.
function catSitArt({ look = [0, 0], happy = false } = {}) {
  const [lx, ly] = look;
  const eyes = happy
    ? '<path d="M52 36Q57 29 62 36M70 36Q75 29 80 36" fill="none" style="stroke-width:2.8"/>'
    : `<g class="cat-eyes"><g transform="translate(${r1(lx)} ${r1(ly)})">
        <ellipse class="ns" cx="57" cy="34" rx="3.8" ry="4.8" fill="${C.ink}"/><ellipse class="ns" cx="75" cy="34" rx="3.8" ry="4.8" fill="${C.ink}"/>
        <circle class="ns" cx="58.4" cy="32.2" r="1.4" fill="#fff"/><circle class="ns" cx="76.4" cy="32.2" r="1.4" fill="#fff"/></g></g>`;
  const bl = happy ? ['7', '4.2', '.85'] : ['5.5', '3.2', '.55'];
  return `
  <g class="cat-tail2"><path d="M86 94C114 96 122 70 108 58" fill="none" style="stroke-width:14"/><path d="M86 94C114 96 122 70 108 58" fill="none" style="stroke:${CAT};stroke-width:8"/></g>
  <path d="M42 98C36 74 44 52 66 52C88 52 96 74 90 98Z" fill="${CAT}"/>
  <ellipse class="ns" cx="66" cy="80" rx="12" ry="15" fill="${CAT_L}"/>
  <path d="M46 32L47 6L64 20Z" fill="${CAT}"/><path d="M86 32L85 6L68 20Z" fill="${CAT}"/>
  <path class="ns" d="M50 26L50.5 13L59 20Z" fill="${C.blush}" opacity=".7"/><path class="ns" d="M82 26L81.5 13L73 20Z" fill="${C.blush}" opacity=".7"/>
  <circle cx="66" cy="34" r="24" fill="${CAT}"/>
  <path d="M60 13Q62 18 60 22M66 11V20M72 13Q70 18 72 22" fill="none" class="thin" style="stroke:${CAT_D}"/>
  ${eyes}
  <path class="ns" d="M63 41H69L66 44Z" fill="${C.blush}"/>
  <path d="M66 44Q63 48 59 46M66 44Q69 48 73 46" fill="none" class="thin"/>
  <ellipse class="ns" cx="49" cy="43" rx="${bl[0]}" ry="${bl[1]}" fill="${C.blush}" opacity="${bl[2]}"/>
  <ellipse class="ns" cx="83" cy="43" rx="${bl[0]}" ry="${bl[1]}" fill="${C.blush}" opacity="${bl[2]}"/>
  <path d="M41 40H31M41 44L32 47M91 40H101M91 44L100 47" fill="none" class="thin" style="opacity:.45"/>
  <ellipse class="thin" cx="56" cy="96" rx="9" ry="5.5" fill="${CAT}"/><ellipse class="thin" cx="76" cy="96" rx="9" ry="5.5" fill="${CAT}"/>`;
}

// Yürüyen kedi (yana bakar, sağa doğru). Bacaklar CSS ile adım atar.
function catWalkArt() {
  const leg = (x, cls, fill) => `<g class="leg ${cls}"><rect x="${x}" y="68" width="11" height="30" rx="5.5" fill="${fill}"/></g>`;
  return `
  <g class="walk-bob">
  <g class="cat-tail3"><path d="M32 60C14 56 8 36 18 22" fill="none" style="stroke-width:13"/><path d="M32 60C14 56 8 36 18 22" fill="none" style="stroke:${CAT};stroke-width:7"/></g>
  ${leg(38, 'la', CAT_FAR)}${leg(84, 'lb', CAT_FAR)}
  <ellipse cx="60" cy="62" rx="36" ry="19" fill="${CAT}"/>
  <path d="M48 46Q52 54 48 62M62 44Q66 53 62 62M76 46Q80 54 76 62" fill="none" class="thin" style="stroke:${CAT_D}"/>
  ${leg(48, 'lb', CAT)}${leg(94, 'la', CAT)}
  <path d="M90 34L92 10L106 26Z" fill="${CAT}"/><path d="M108 30L118 8L122 34Z" fill="${CAT}"/>
  <path class="ns" d="M93 28L94 16L102 25Z" fill="${C.blush}" opacity=".7"/>
  <circle cx="104" cy="44" r="21" fill="${CAT}"/>
  <ellipse class="ns" cx="111" cy="42" rx="3.2" ry="4.3" fill="${C.ink}"/><circle class="ns" cx="112.2" cy="40.5" r="1.2" fill="#fff"/>
  <path class="ns" d="M121 47L125.5 48.5L122 51Z" fill="${C.blush}"/>
  <path d="M122 51Q120 55 116 54" fill="none" class="thin"/>
  <ellipse class="ns" cx="111" cy="52" rx="5" ry="3" fill="${C.blush}" opacity=".55"/>
  <path d="M124 50H131M123 54L130 56" fill="none" class="thin" style="opacity:.45"/>
  </g>`;
}

function catArt({ pose = 'sleep', look } = {}) {
  if (pose === 'sit') return catSitArt({ look });
  if (pose === 'happy') return catSitArt({ happy: true });
  if (pose === 'walk') return catWalkArt();
  return catSleepArt;
}

const teddyArt = `
  <circle cx="24" cy="20" r="12" fill="#d9a273"/><circle cx="68" cy="20" r="12" fill="#d9a273"/>
  <circle class="ns" cx="24" cy="20" r="6" fill="#f2c9a0"/><circle class="ns" cx="68" cy="20" r="6" fill="#f2c9a0"/>
  <ellipse cx="46" cy="76" rx="30" ry="24" fill="#d9a273"/>
  <ellipse cx="18" cy="72" rx="9" ry="14" fill="#d9a273" transform="rotate(25 18 72)"/>
  <ellipse cx="74" cy="72" rx="9" ry="14" fill="#d9a273" transform="rotate(-25 74 72)"/>
  <ellipse cx="26" cy="94" rx="13" ry="8" fill="#d9a273"/><ellipse cx="66" cy="94" rx="13" ry="8" fill="#d9a273"/>
  <path class="thin" d="${heart(46, 66, 22)}" fill="${C.blush}"/>
  <circle cx="46" cy="40" r="26" fill="#d9a273"/>
  <ellipse class="thin" cx="46" cy="48" rx="11" ry="8" fill="#f2c9a0"/>
  <ellipse class="ns" cx="46" cy="45" rx="4" ry="3" fill="${C.ink}"/>
  <circle class="ns" cx="36" cy="36" r="3.2" fill="${C.ink}"/><circle class="ns" cx="56" cy="36" r="3.2" fill="${C.ink}"/>
  <ellipse class="ns" cx="28" cy="46" rx="5" ry="3" fill="${C.blush}" opacity=".6"/>
  <ellipse class="ns" cx="64" cy="46" rx="5" ry="3" fill="${C.blush}" opacity=".6"/>`;

// Kupa: dokununca buharı açılır/kapanır (içerken aç).
const mugArt = ({ on = false } = {}) => `
  ${on ? '<path class="steam" d="M21 14Q16 9 21 4M31 14Q26 9 31 4" fill="none" style="stroke:#d9a7bc;stroke-width:2.5"/>' : ''}
  <path d="M38 26A9 9 0 0 1 38 44" fill="none" style="stroke-width:7"/>
  <path d="M38 26A9 9 0 0 1 38 44" fill="none" style="stroke:#fff;stroke-width:2"/>
  <path d="M10 20H40V44A6 6 0 0 1 34 50H16A6 6 0 0 1 10 44Z" fill="#fff"/>
  <path class="ns" d="${heart(25, 27, 15)}" fill="${C.blush}"/>`;

const booksArt = `
  <rect x="8" y="44" width="82" height="16" rx="3" fill="${C.blue}"/>
  <path d="M16 52H84" fill="none" class="thin" style="stroke:#fff"/>
  <rect x="14" y="28" width="70" height="16" rx="3" fill="${C.pink}"/>
  <path d="M22 36H78" fill="none" class="thin" style="stroke:#fff"/>
  <rect x="6" y="12" width="76" height="16" rx="3" fill="${C.mint}" transform="rotate(-4 44 20)"/>`;

const moonLampArt = ({ on = true } = {}) => `
  <rect x="20" y="74" width="34" height="10" rx="4" fill="${C.wood}"/>
  <rect x="34" y="60" width="6" height="16" fill="${C.wood}"/>
  <circle cx="37" cy="34" r="30" fill="${on ? '#fff3c4' : '#ece6d8'}"/>
  <circle class="ns" cx="28" cy="26" r="6" fill="${on ? '#f3e2a0' : '#ddd6c6'}"/><circle class="ns" cx="46" cy="42" r="8" fill="${on ? '#f3e2a0' : '#ddd6c6'}"/><circle class="ns" cx="45" cy="19" r="3.5" fill="${on ? '#f3e2a0' : '#ddd6c6'}"/>`;

// Çöp kutusu: silinen notlar buruşturulmuş kağıt topu olarak birikir, dolunca taşar.
export const TRASH_CAP = 12;
const trashArt = ({ trash = 0 } = {}) => {
  const n = Math.min(trash, TRASH_CAP);
  const full = trash >= TRASH_CAP;
  // Kağıtlar ağızdan yükselerek birikir; son ikisi taşıp yere düşer.
  const spots = [[26, 46], [44, 44], [62, 46], [78, 44], [35, 35], [53, 33], [71, 35], [44, 24], [62, 22], [53, 12], [6, 110], [98, 106]];
  const cols = ['#fff3a6', '#ffd1e3', '#c9f0dd', '#cfe6ff', '#e4d6ff', '#ffd9b8'];
  const balls = spots.slice(0, n).map(([x, y], i) => `<circle class="thin" cx="${x}" cy="${y}" r="${i % 3 ? 9 : 10}" fill="${cols[i % 6]}"/><path d="M${x - 4} ${y - 2}l4 3l3 -4" fill="none" class="thin" style="opacity:.5"/>`).join('');
  return `
  ${balls}
  <path d="M16 50H88L80 118H24Z" fill="${C.lilac}"/>
  <path d="M36 62L38 108M52 62V108M68 62L66 108" fill="none" class="thin" style="opacity:.45"/>
  <rect x="10" y="44" width="84" height="12" rx="6" fill="${C.lilacD}"/>
  <path class="ns" d="${heart(52, 76, 18)}" fill="#fff" opacity=".75"/>
  ${full ? `<g class="trash-full"><circle cx="92" cy="12" r="11" fill="${C.rose}"/><text x="92" y="19" text-anchor="middle" font-size="18" font-weight="800" fill="#fff" font-family="Nunito, sans-serif">!</text></g>` : ''}`;
};

/* ---------- Avatar köşesi (Güzin'e özel) ---------- */

const FUR = '#fbf5ea', FUR_D = '#efe3cf', BROWN = '#a0704e', BROWN_D = '#6b4a3a';

// Appa: uçan gök bizonu. Odada kendi kendine süzülür (app.js), kuyruğu kanat gibi çırpar.
const appaArt = () => {
  const leg = (x, fill) => `<rect x="${x}" y="114" width="20" height="34" rx="9" fill="${fill}"/><ellipse class="thin" cx="${x + 10}" cy="147" rx="9" ry="4" fill="${BROWN}"/>`;
  return `
  <g class="appa-bob">
  <g class="appa-tail"><path d="M60 80C32 70 6 80 4 98C2 116 28 126 60 108Z" fill="${FUR}"/><path d="M16 92C11 100 13 108 21 112" fill="none" class="thin" style="opacity:.4"/></g>
  ${leg(100, FUR_D)}${leg(160, FUR_D)}${leg(216, FUR_D)}
  <path d="M50 84C46 44 96 26 160 26C222 24 262 44 266 82C270 118 236 134 164 134C96 136 54 122 50 84Z" fill="${FUR}"/>
  <path d="M74 50q8-8 16 0q8-8 16 0M216 44q7-7 14 0q7-7 14 0" fill="none" class="thin" style="opacity:.35"/>
  <path d="M80 118C130 130 200 130 246 114" fill="none" class="thin" style="opacity:.3"/>
  <path d="M118 32C120 14 196 14 200 32L204 48H114Z" fill="#d9776b"/>
  <path d="M136 22H182" fill="none" class="thin" style="stroke:#f2cf9f;stroke-width:3"/>
  <rect x="106" y="42" width="106" height="11" rx="5.5" fill="#f2cf9f"/>
  ${leg(78, FUR)}${leg(136, FUR)}${leg(194, FUR)}
  <path d="M262 40C258 24 246 18 236 22C246 26 251 32 253 42Z" fill="${BROWN}"/>
  <path d="M232 78C226 44 252 30 278 34C304 38 318 60 314 86C310 108 290 118 268 116C246 114 236 100 232 78Z" fill="${FUR}"/>
  <path d="M284 36C286 22 298 14 306 18C298 22 294 28 292 38Z" fill="${BROWN}"/>
  <path d="M236 60L274 44L306 56L296 63L274 54L248 66Z" fill="${BROWN}"/>
  <ellipse class="ns" cx="288" cy="72" rx="3.4" ry="4" fill="${BROWN_D}"/><circle class="ns" cx="289.2" cy="70.6" r="1.1" fill="#fff"/>
  <ellipse class="ns" cx="275" cy="90" rx="8" ry="5" fill="${C.blush}" opacity=".5"/>
  <ellipse cx="305" cy="90" rx="8" ry="6.5" fill="${BROWN_D}"/>
  <path d="M284 102Q295 110 306 101" fill="none" class="thin"/>
  </g>`;
};

const momoArt = () => `
  <path d="M60 88C86 88 88 58 72 52" fill="none" style="stroke-width:10"/>
  <path d="M60 88C86 88 88 58 72 52" fill="none" style="stroke:#cfc8d3;stroke-width:5"/>
  <path d="M60 88C86 88 88 58 72 52" fill="none" style="stroke:#9d93a3;stroke-width:5;stroke-dasharray:3 6"/>
  <g class="momo-ears">
    <path d="M32 34C10 28 0 8 6 2C20 4 32 16 38 28Z" fill="#cfc8d3"/>
    <path d="M54 34C76 28 86 8 80 2C66 4 54 16 48 28Z" fill="#cfc8d3"/>
    <path class="ns" d="M30 28C18 24 12 14 13 9C21 11 29 18 33 25Z" fill="${C.blush}" opacity=".6"/>
    <path class="ns" d="M56 28C68 24 74 14 73 9C65 11 57 18 53 25Z" fill="${C.blush}" opacity=".6"/>
  </g>
  <ellipse cx="43" cy="72" rx="21" ry="21" fill="#cfc8d3"/>
  <ellipse class="ns" cx="43" cy="76" rx="13" ry="15" fill="#f4f0f6"/>
  <circle cx="43" cy="40" r="19" fill="#cfc8d3"/>
  <ellipse class="ns" cx="43" cy="45" rx="13" ry="11" fill="#f4f0f6"/>
  <circle class="thin" cx="35" cy="40" r="6.5" fill="#9edc75"/><circle class="thin" cx="51" cy="40" r="6.5" fill="#9edc75"/>
  <circle class="ns" cx="35" cy="40.5" r="3.4" fill="${C.ink}"/><circle class="ns" cx="51" cy="40.5" r="3.4" fill="${C.ink}"/>
  <circle class="ns" cx="36.4" cy="38.6" r="1.3" fill="#fff"/><circle class="ns" cx="52.4" cy="38.6" r="1.3" fill="#fff"/>
  <path class="ns" d="M41 48H45L43 50Z" fill="${C.ink}"/>
  <path d="M43 50Q40 53 38 51M43 50Q46 53 48 51" fill="none" class="thin"/>
  <ellipse class="thin" cx="33" cy="91" rx="8" ry="5" fill="#cfc8d3"/><ellipse class="thin" cx="53" cy="91" rx="8" ry="5" fill="#cfc8d3"/>`;

const elementsArt = `
  <rect x="6" y="8" width="138" height="168" rx="6" fill="#fff8ec"/>
  <circle cx="45" cy="56" r="25" fill="#ffe7b8"/>
  <path d="M45 56m-14 0a14 14 0 1 1 14 14a9 9 0 1 1 -9 -9a4 4 0 1 1 4 4" fill="none" style="stroke:#e09a3e;stroke-width:3.5"/>
  <circle cx="105" cy="56" r="25" fill="#d4ecff"/>
  <path d="M86 52q5-6 10 0t10 0t10 0M86 62q5-6 10 0t10 0t10 0" fill="none" style="stroke:#4f8fd6;stroke-width:3.5"/>
  <circle cx="45" cy="124" r="25" fill="#d6f2bf"/>
  <path d="M28 136L40 112L47 122L53 114L63 136Z" fill="#8fc27d"/>
  <circle cx="105" cy="124" r="25" fill="#ffd6cc"/>
  <path d="M105 104C116 118 118 126 114 134C110 141 100 141 96 134C92 126 98 120 101 114C103 120 106 122 108 120C110 116 108 110 105 104Z" fill="#f0705a"/>
  <path class="ns" d="${heart(75, 154, 14)}" fill="${C.rose}"/>
  <rect class="ns" x="58" y="0" width="34" height="14" rx="2" fill="#fff4b8" opacity=".9" transform="rotate(4 75 7)"/>`;

const gliderArt = `
  <path d="M40 34L64 64L58 150L40 172Z" fill="#f4a65c"/>
  <path d="M40 34L16 64L22 150L40 172Z" fill="#e8834a"/>
  <path d="M40 60L28 74M40 92L24 104M40 124L26 134" fill="none" class="thin" style="opacity:.4"/>
  <rect x="35" y="16" width="10" height="240" rx="5" fill="${C.wood}"/>
  <circle cx="40" cy="16" r="8" fill="${C.woodD}"/>
  <path d="M40 214m-8 0a8 8 0 1 1 8 8a5 5 0 1 1 -5 -5" fill="none" style="stroke:#7fb7e6;stroke-width:3"/>`;

const teapotArt = ({ on = false } = {}) => `
  ${on ? '<path class="steam" d="M40 14Q35 9 40 4M50 14Q45 9 50 4" fill="none" style="stroke:#a9cbbd;stroke-width:2.5"/>' : ''}
  <path d="M68 32C86 30 88 56 70 58" fill="none" style="stroke-width:7"/>
  <path d="M68 32C86 30 88 56 70 58" fill="none" style="stroke:#a8d8c0;stroke-width:2.5"/>
  <path d="M24 44C12 40 6 28 10 24C16 30 22 34 30 36Z" fill="#a8d8c0"/>
  <ellipse cx="46" cy="48" rx="27" ry="22" fill="#bfe8d6"/>
  <path d="M30 30C34 20 58 20 62 30Z" fill="#a8d8c0"/>
  <circle cx="46" cy="18" r="4" fill="#a8d8c0"/>
  ${[0, 72, 144, 216, 288].map(a => `<ellipse class="ns" cx="${r1(46 + Math.sin(a * Math.PI / 180) * 6)}" cy="${r1(50 - Math.cos(a * Math.PI / 180) * 6)}" rx="3.2" ry="5.5" fill="#fff" transform="rotate(${a} ${r1(46 + Math.sin(a * Math.PI / 180) * 6)} ${r1(50 - Math.cos(a * Math.PI / 180) * 6)})"/>`).join('')}
  <circle class="ns" cx="46" cy="50" r="3" fill="${C.yellow}"/>
  <ellipse class="ns" cx="46" cy="70" rx="18" ry="3" fill="#000" opacity=".06"/>`;

/* ---------- Deniz'in hediyeleri (dükkanda yok) ---------- */

const rosesArt = `
  <path d="M42 90L30 40M42 90L42 28M42 90L56 44" fill="none" style="stroke:${C.greenD}"/>
  <path class="thin" d="M36 66C24 64 20 56 22 50C30 52 34 58 36 66Z" fill="${C.green}"/>
  <path class="thin" d="M48 62C60 60 64 52 62 46C54 48 50 54 48 62Z" fill="${C.green}"/>
  ${[[30, 38, C.red], [42, 25, '#ff8fae'], [56, 42, C.red]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="13" fill="${c}"/><path d="M${x - 6} ${y}Q${x} ${y - 8} ${x + 6} ${y}Q${x} ${y + 6} ${x - 2} ${y}" fill="none" class="thin"/>`).join('')}
  <path d="M26 84H58C60 100 62 114 54 128H30C22 114 24 100 26 84Z" fill="#d7efff"/>
  <rect x="22" y="80" width="40" height="8" rx="4" fill="#eaf6ff"/>
  <path class="ns" d="${heart(42, 98, 16)}" fill="${C.rose}"/>`;

const balloonArt = `
  <g class="balloon-bob">
    <path d="M42 90C36 120 50 146 40 172C34 190 44 200 42 206" fill="none" class="thin"/>
    <path d="${heart(42, 6, 80)}" fill="${C.red}"/>
    <path d="M17 30C19 20 27 15 34 17" fill="none" style="stroke:#fff;stroke-width:5;opacity:.8"/>
    <path class="thin" d="M37 80H47L42 90Z" fill="${C.red}"/>
  </g>`;

const neonText = (x, t) => `<text x="${x}" y="80" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="64" fill="#ffe4f1" style="stroke:#ff4f9a;stroke-width:3;paint-order:stroke">${t}</text>`;
const neonOff = (x, t) => `<text x="${x}" y="80" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="64" fill="#f6e6ee" style="stroke:#d9a7bc;stroke-width:3;paint-order:stroke">${t}</text>`;
const neonArt = ({ on = true } = {}) => on
  ? `<g filter="url(#neon)">${neonText(52, 'G')}<path d="${heart(115, 26, 58)}" fill="#ffe4f1" style="stroke:#ff4f9a;stroke-width:3"/>${neonText(178, 'D')}</g>`
  : `<g>${neonOff(52, 'G')}<path d="${heart(115, 26, 58)}" fill="#f6e6ee" style="stroke:#d9a7bc;stroke-width:3"/>${neonOff(178, 'D')}</g>`;

const envelopeArt = `
  <rect x="2" y="2" width="84" height="56" rx="8" fill="#fff"/>
  <path d="M6 8L44 36L82 8" fill="none"/>
  <path class="ns" d="${heart(44, 26, 24)}" fill="${C.rose}"/>`;
export const ENVELOPE = { w: 88, h: 60, art: envelopeArt };

/* ---------- Katalog ---------- */
// layer: wall (duvarda), floor (zeminde, öndeki öne çizilir), rug (halı, en altta),
//        deco (küçük süs, her şeyin üstüne konabilir)

export const ITEMS = {
  window:     { name: 'Pencere', layer: 'wall', w: 270, h: 230, fixed: true, noFlip: true, art: windowArt },
  fridge:     { name: 'Buzdolabı', layer: 'floor', w: 150, h: 300, fixed: true, art: fridgeArt },
  door:       { name: 'Kapı', layer: 'floor', w: 170, h: 382, fixed: true, noFlip: true, art: doorArt },

  mug:        { name: 'Kupa', layer: 'deco', w: 56, h: 54, price: 2, art: mugArt, toggle: false },
  books:      { name: 'Kitap yığını', layer: 'deco', w: 96, h: 64, price: 3, art: booksArt, folder: true },
  smallPlant: { name: 'Küçük saksı', layer: 'deco', w: 64, h: 80, price: 3, art: smallPlantArt },
  poster:     { name: 'Lale posteri', layer: 'wall', w: 124, h: 160, price: 4, art: posterArt },
  garland:    { name: 'Flama', layer: 'wall', w: 380, h: 84, price: 4, art: garlandArt },
  deskLamp:   { name: 'Masa lambası', layer: 'deco', w: 80, h: 96, price: 5, art: deskLampArt, toggle: true, glow: [{ cx: 64, cy: 42, r: 80 }] },
  clock:      { name: 'Duvar saati', layer: 'wall', w: 104, h: 104, price: 5, art: clockArt, noFlip: true },
  trash:      { name: 'Çöp kutusu', layer: 'floor', w: 104, h: 122, price: 6, art: trashArt },
  pouf:       { name: 'Puf', layer: 'floor', w: 116, h: 80, price: 5, art: poufArt },
  rugRound:   { name: 'Yuvarlak halı', layer: 'rug', w: 320, h: 76, price: 6, art: rugRoundArt },
  chair:      { name: 'Sandalye', layer: 'floor', w: 110, h: 168, price: 6, art: chairArt },
  shelf:      { name: 'Duvar rafı', layer: 'wall', w: 210, h: 86, price: 6, art: shelfArt, toggle: true, folder: true, glow: [{ cx: 99, cy: 16, r: 46 }] },
  moonLamp:   { name: 'Ay lambası', layer: 'deco', w: 74, h: 86, price: 6, art: moonLampArt, toggle: true, glow: [{ cx: 37, cy: 34, r: 110 }] },
  rugStripe:  { name: 'Çizgili halı', layer: 'rug', w: 300, h: 64, price: 7, art: rugStripeArt },
  painting:   { name: 'Tablo', layer: 'wall', w: 160, h: 124, price: 7, art: paintingArt, photos: 1 },
  monstera:   { name: 'Monstera', layer: 'floor', w: 140, h: 216, price: 8, art: monsteraArt },
  nightstand: { name: 'Komodin', layer: 'floor', w: 116, h: 124, price: 8, art: nightstandArt },
  fairy:      { name: 'Işık zinciri', layer: 'wall', w: 420, h: 70, price: 8, art: fairyArt, toggle: true, glow: FAIRY_PTS.map(([x, y]) => ({ cx: x, cy: y + 13, r: 34 })) },
  rugHeart:   { name: 'Kalp halı', layer: 'rug', w: 250, h: 88, price: 9, art: rugHeartArt },
  mirror:     { name: 'Ayna', layer: 'wall', w: 112, h: 176, price: 9, art: mirrorArt },
  floorLamp:  { name: 'Lambader', layer: 'floor', w: 90, h: 290, price: 9, art: floorLampArt, toggle: true, glow: [{ cx: 45, cy: 78, r: 140 }] },
  polaroids:  { name: 'Fotoğraf ipi', layer: 'wall', w: 380, h: 110, price: 10, art: polaroidArt, photos: 4 },
  teddy:      { name: 'Ayıcık', layer: 'deco', w: 92, h: 104, price: 10, art: teddyArt },
  desk:       { name: 'Çalışma masası', layer: 'floor', w: 260, h: 166, price: 15, art: deskArt },
  bookshelf:  { name: 'Kitaplık', layer: 'floor', w: 170, h: 300, price: 16, art: bookshelfArt, folder: true },
  armchair:   { name: 'Koltuk', layer: 'floor', w: 220, h: 170, price: 18, art: armchairArt },
  cat:        { name: 'Kedi', layer: 'deco', w: 132, h: 100, price: 20, art: catArt },
  bed:        { name: 'Yatak', layer: 'floor', w: 360, h: 200, price: 25, art: bedArt },

  teapot:     { name: "Iroh'un çaydanlığı", layer: 'deco', w: 90, h: 74, price: 6, art: teapotArt, toggle: false, tag: 'Avatar' },
  elements:   { name: 'Dört element posteri', layer: 'wall', w: 150, h: 180, price: 9, art: elementsArt, tag: 'Avatar' },
  glider:     { name: 'Hava göçebesi planörü', layer: 'wall', w: 80, h: 260, price: 14, art: gliderArt, tag: 'Avatar' },
  momo:       { name: 'Momo', layer: 'deco', w: 88, h: 98, price: 22, art: momoArt, tag: 'Avatar' },
  appa:       { name: 'Appa', layer: 'deco', w: 320, h: 156, price: 80, art: appaArt, tag: 'Avatar' },

  roses:      { name: 'Gül buketi', layer: 'deco', w: 84, h: 132, gift: true, art: rosesArt },
  balloon:    { name: 'Kalp balon', layer: 'deco', w: 84, h: 210, gift: true, art: balloonArt },
  neon:       { name: 'Neon G ♡ D', layer: 'wall', w: 230, h: 110, gift: true, noFlip: true, art: neonArt, toggle: true, glow: [{ cx: 115, cy: 55, r: 160, c: 'glowPink' }] },
};

export const SHOP = Object.keys(ITEMS).filter(k => !ITEMS[k].fixed && !ITEMS[k].gift);
export const GIFTS = Object.keys(ITEMS).filter(k => ITEMS[k].gift);

export const WALLS = {
  dots:    { name: 'Pembe puantiye', price: 0 },
  stripes: { name: 'Krem çizgili', price: 6 },
  grid:    { name: 'Mint kareli', price: 6 },
  hearts:  { name: 'Lila kalpler', price: 8 },
  clouds:  { name: 'Bulutlar', price: 8 },
  stars:   { name: 'Yıldızlı gece', price: 10 },
};
export const FLOORS = {
  wood:    { name: 'Parke', price: 0 },
  light:   { name: 'Açık ahşap', price: 5 },
  carpet:  { name: 'Pembe halıfleks', price: 7 },
  checker: { name: 'Damalı', price: 8 },
};

export function defsSVG() {
  const sky = (id, a, b) => `<linearGradient id="sky-${id}" gradientUnits="userSpaceOnUse" x1="0" y1="34" x2="0" y2="200"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const glow = (id, a, b) => `<radialGradient id="${id}"><stop offset="0" stop-color="${a}" stop-opacity=".85"/><stop offset=".45" stop-color="${b}" stop-opacity=".3"/><stop offset="1" stop-color="${b}" stop-opacity="0"/></radialGradient>`;
  const pat = (id, w, h, body) => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${body}</pattern>`;
  const planks = (a, b, line) => `<rect width="220" height="52" fill="${a}"/><rect y="26" width="220" height="26" fill="${b}"/><path d="M0 1H220M0 27H220M70 1V27M180 27V52" stroke="${line}" stroke-width="2.5"/>`;
  return `
  ${sky('day', '#8fd0ff', '#d9f1ff')}${sky('dawn', '#ffc6d9', '#cfe8ff')}${sky('sunset', '#ff8f9e', '#ffcf94')}${sky('night', '#232457', '#4b3f86')}
  ${glow('glow', '#fff1b8', '#ffd98a')}${glow('glowPink', '#ffc4e0', '#ff6fae')}
  <linearGradient id="floorShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2d42" stop-opacity=".16"/><stop offset="1" stop-color="#5a2d42" stop-opacity="0"/></linearGradient>
  <linearGradient id="wallShade" x1="0" x2="1"><stop offset="0" stop-color="#5a2d42" stop-opacity=".09"/><stop offset=".12" stop-color="#5a2d42" stop-opacity="0"/><stop offset=".88" stop-color="#5a2d42" stop-opacity="0"/><stop offset="1" stop-color="#5a2d42" stop-opacity=".09"/></linearGradient>
  <filter id="neon" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  ${pat('wp-dots', 44, 44, `<rect width="44" height="44" fill="#ffe3ee"/><circle cx="11" cy="11" r="4.5" fill="#fff"/><circle cx="33" cy="33" r="4.5" fill="#fff"/>`)}
  ${pat('wp-stripes', 64, 10, `<rect width="64" height="10" fill="#fff6e8"/><rect width="22" height="10" fill="#ffe6c7"/>`)}
  ${pat('wp-grid', 56, 56, `<rect width="56" height="56" fill="#e6f7ef"/><path d="M0 1.5H56M1.5 0V56" stroke="#cdeedd" stroke-width="3"/>`)}
  ${pat('wp-hearts', 80, 80, `<rect width="80" height="80" fill="#f0e8ff"/><path d="${heart(20, 12, 20)}" fill="#e0d0ff"/><path d="${heart(60, 52, 20)}" fill="#e0d0ff"/>`)}
  ${pat('wp-clouds', 220, 150, `<rect width="220" height="150" fill="#e2f1ff"/>${cloud(30, 40, 1)}${cloud(140, 110, .8)}`)}
  ${pat('wp-stars', 90, 90, `<rect width="90" height="90" fill="#3a3466"/><path d="${star(20, 22, 6)}" fill="#fff3c4"/><circle cx="64" cy="18" r="2" fill="#fff"/><path d="${star(62, 64, 4.5)}" fill="#ffd6e5"/><circle cx="24" cy="70" r="2.2" fill="#fff"/>`)}
  ${pat('fl-wood', 220, 52, planks('#e9b98c', '#e4b083', '#cf9a68'))}
  ${pat('fl-light', 220, 52, planks('#f5ddbb', '#f0d4ad', '#dcb98b'))}
  ${pat('fl-carpet', 24, 24, `<rect width="24" height="24" fill="#f6c4d5"/><circle cx="6" cy="6" r="2" fill="#f0afc5"/><circle cx="18" cy="18" r="2" fill="#f0afc5"/>`)}
  ${pat('fl-checker', 80, 80, `<rect width="80" height="80" fill="#fff6f9"/><rect width="40" height="40" fill="#f9d3e1"/><rect x="40" y="40" width="40" height="40" fill="#f9d3e1"/>`)}`;
}

// Açılıp kapanan eşyalar (lamba, mum, kupa buharı): kayıtlı değer yoksa eşyanın varsayılanı.
export const itemOn = (p, def) => (typeof p?.on === 'boolean' ? p.on : def?.toggle !== false);

export const artOf = (def, ctx = {}) => (typeof def.art === 'function' ? def.art(ctx) : def.art);

export function thumbSVG(id, ctx = {}) {
  const d = ITEMS[id];
  return `<svg viewBox="-6 -6 ${d.w + 12} ${d.h + 12}" aria-hidden="true"><g class="art">${artOf(d, { now: new Date(), phase: 'day', postits: [], ...ctx })}</g></svg>`;
}
export const swatchSVG = (kind, key) => `<svg viewBox="0 0 120 80" aria-hidden="true"><rect x="1.5" y="1.5" width="117" height="77" rx="12" fill="url(#${kind}-${key})" stroke="${C.ink}" stroke-width="3"/></svg>`;

// Odadaki konumu sınırla: duvar eşyası duvarda, zemin eşyası zeminde kalsın.
export function clampPos(def, x, y) {
  const { W, H, WALL } = STAGE;
  x = Math.max(0, Math.min(W - def.w, x));
  if (def.layer === 'wall') y = Math.max(0, Math.min(WALL - def.h + 4, y));
  else if (def.layer === 'floor') y = Math.max(WALL + 18, Math.min(H - 4, y + def.h)) - def.h;
  else if (def.layer === 'rug') y = Math.max(WALL + def.h + 8, Math.min(H - 6, y + def.h)) - def.h;
  else y = Math.max(0, Math.min(H - def.h, y));
  return [Math.round(x), Math.round(y)];
}

// Yeni alınan eşya odanın neresinde belirsin.
export function spawnPos(def) {
  const j = Math.round(Math.random() * 80 - 40);
  const x = 500 - def.w / 2 + j;
  if (def.layer === 'wall') return clampPos(def, x, 300 - def.h / 2);
  if (def.layer === 'floor') return clampPos(def, x, 800 - def.h);
  if (def.layer === 'rug') return clampPos(def, x, 868 - def.h);
  return clampPos(def, x, 740 - def.h);
}

export function defaultState() {
  return {
    v: 1,
    hearts: 5,
    wall: 'dots',
    floor: 'wood',
    ownWall: { dots: true },
    ownFloor: { wood: true },
    placed: {
      window: { item: 'window', x: 365, y: 70, z: 1 },
      fridge: { item: 'fridge', x: 60, y: 520 },
      door: { item: 'door', x: 800, y: 260 },
    },
    inventory: {},
    todos: {},
    notes: {},
    bonus: {},
    unlock: {},
    settings: { eveningHour: 18 },
    stats: { done: 0 },
    curtain: false,
    light: false,
    timer: { dur: 25 * 60, label: 'Odak' },
    studyLog: {},
    createdAt: Date.now(),
  };
}
