// Febre Doces — desenhos originais dos doces (SVG)
const DEFS = `<svg width="0" height="0" style="position:absolute"><defs>
<radialGradient id="gV" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffb3bd"/><stop offset=".5" stop-color="#ff4d6a"/><stop offset="1" stop-color="#c8102e"/></radialGradient>
<radialGradient id="gG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d4ffb8"/><stop offset=".5" stop-color="#5fd35a"/><stop offset="1" stop-color="#23913a"/></radialGradient>
<radialGradient id="gA" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fffbd1"/><stop offset=".5" stop-color="#ffd93b"/><stop offset="1" stop-color="#e6a100"/></radialGradient>
<radialGradient id="gZ" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d6f0ff"/><stop offset=".5" stop-color="#46a8ff"/><stop offset="1" stop-color="#1663c7"/></radialGradient>
<radialGradient id="gR" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffe0f0"/><stop offset=".5" stop-color="#ff7ec0"/><stop offset="1" stop-color="#e23f93"/></radialGradient>
<radialGradient id="gM" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c9926a"/><stop offset=".5" stop-color="#7a4426"/><stop offset="1" stop-color="#4a2410"/></radialGradient>
<linearGradient id="gArco" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4d6a"/><stop offset=".2" stop-color="#ffb02e"/><stop offset=".4" stop-color="#ffe23b"/><stop offset=".6" stop-color="#5fd35a"/><stop offset=".8" stop-color="#46a8ff"/><stop offset="1" stop-color="#b56bff"/></linearGradient>
<linearGradient id="gChoc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5634"/><stop offset="1" stop-color="#4f2a14"/></linearGradient>
</defs></svg>`;

const olhos = (y, x1, x2, r) => `<circle cx="${x1}" cy="${y}" r="${r}" fill="#2b1a1a"/><circle cx="${x2}" cy="${y}" r="${r}" fill="#2b1a1a"/><circle cx="${x1+1.5}" cy="${y-1.5}" r="${r*.4}" fill="#fff"/><circle cx="${x2+1.5}" cy="${y-1.5}" r="${r*.4}" fill="#fff"/>`;
const brilho = (x,y,rx,ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".55" transform="rotate(-25 ${x} ${y})"/>`;

const DOCES = [
  // 0 — Bala de morango embrulhada
  `<path d="M6 30 L30 42 L30 58 L6 70 L13 50Z" fill="#ff7a8c"/><path d="M94 30 L70 42 L70 58 L94 70 L87 50Z" fill="#ff7a8c"/>
   <path d="M10 38 L28 46 M10 62 L28 54 M90 38 L72 46 M90 62 L72 54" stroke="#ffd0d7" stroke-width="2.5"/>
   <ellipse cx="50" cy="50" rx="27" ry="23" fill="url(#gV)"/>
   <path d="M30 50 Q40 38 50 50 T70 50" stroke="#fff" stroke-width="4" fill="none" opacity=".5" stroke-linecap="round"/>${brilho(40,38,8,4)}`,
  // 1 — Ursinho de goma
  `<g fill="url(#gG)"><circle cx="31" cy="22" r="10"/><circle cx="69" cy="22" r="10"/><circle cx="50" cy="36" r="21"/>
   <ellipse cx="50" cy="72" rx="23" ry="22"/><ellipse cx="26" cy="64" rx="8" ry="11"/><ellipse cx="74" cy="64" rx="8" ry="11"/>
   <ellipse cx="36" cy="91" rx="9" ry="6"/><ellipse cx="64" cy="91" rx="9" ry="6"/></g>
   <circle cx="31" cy="22" r="4.5" fill="#2fa84f" opacity=".6"/><circle cx="69" cy="22" r="4.5" fill="#2fa84f" opacity=".6"/>
   ${olhos(33,42,58,4)}<ellipse cx="50" cy="43" rx="6" ry="4.5" fill="#bff5a8"/><path d="M46 45 Q50 49 54 45" stroke="#2b1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>
   <ellipse cx="50" cy="74" rx="11" ry="10" fill="#bff5a8" opacity=".6"/>${brilho(40,26,6,3)}`,
  // 2 — Estrelinha de limão
  `<path d="M50 8 L61 36 L91 37 L67 55 L76 85 L50 68 L24 85 L33 55 L9 37 L39 36Z" fill="url(#gA)" stroke="#f0b400" stroke-width="5" stroke-linejoin="round"/>
   ${olhos(48,41,59,4)}<path d="M44 58 Q50 64 56 58" stroke="#2b1a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
   <circle cx="34" cy="57" r="4" fill="#ff9f6b" opacity=".6"/><circle cx="66" cy="57" r="4" fill="#ff9f6b" opacity=".6"/>${brilho(42,28,6,3)}`,
  // 3 — Pirulito azul
  `<rect x="46" y="66" width="8" height="30" rx="4" fill="#f4f4f8"/><rect x="46" y="66" width="8" height="30" rx="4" fill="none" stroke="#d6d6e0" stroke-width="1.5"/>
   <circle cx="50" cy="42" r="31" fill="url(#gZ)"/>
   <path d="M50 42 m0 -4 a4 4 0 1 1 -4 4 a8 8 0 0 1 8 -8 a12 12 0 0 1 12 12 a16 16 0 0 1 -16 16 a20 20 0 0 1 -20 -20 a24 24 0 0 1 24 -24" stroke="#fff" stroke-width="4.5" fill="none" opacity=".75" stroke-linecap="round"/>
   ${brilho(37,26,8,4)}`,
  // 4 — Rosquinha com granulado
  `<circle cx="50" cy="52" r="38" fill="#e9b47c"/><circle cx="50" cy="52" r="38" fill="none" stroke="#c98a52" stroke-width="3"/>
   <path d="M50 18 C64 16 72 24 80 30 C88 38 86 48 86 54 C88 64 80 74 72 80 C62 88 46 88 36 82 C24 78 16 66 15 56 C14 44 20 32 28 26 C36 20 42 18 50 18Z" fill="url(#gR)"/>
   <circle cx="50" cy="52" r="12" fill="#c98a52"/><circle cx="50" cy="52" r="9" fill="#7a4f2a"/>
   <g stroke-width="4" stroke-linecap="round"><path d="M30 38 l5 -3" stroke="#fff"/><path d="M64 30 l5 3" stroke="#46a8ff"/><path d="M72 58 l3 5" stroke="#ffd93b"/><path d="M38 72 l5 2" stroke="#5fd35a"/><path d="M27 56 l1 6" stroke="#fff"/><path d="M58 74 l5 -2" stroke="#ffd93b"/><path d="M48 30 l4 1" stroke="#5fd35a"/><path d="M76 42 l-2 5" stroke="#fff"/></g>
   ${brilho(36,30,7,3)}`,
  // 5 — Brigadeiro na forminha
  `<path d="M16 58 L84 58 L76 92 L24 92Z" fill="#d9a441"/><path d="M24 58 L28 92 M36 58 L38 92 M50 58 L50 92 M64 58 L62 92 M76 58 L72 92" stroke="#b5832a" stroke-width="2.5"/>
   <circle cx="50" cy="46" r="29" fill="url(#gM)"/>
   <g stroke-width="3.5" stroke-linecap="round" stroke="#2e140a"><path d="M36 30 l4 -2"/><path d="M58 24 l4 2"/><path d="M66 42 l2 4"/><path d="M32 48 l1 4"/><path d="M48 62 l4 -1"/><path d="M60 56 l3 -3"/><path d="M44 36 l3 2"/></g>
   ${olhos(46,41,59,3.6)}<path d="M45 54 Q50 58 55 54" stroke="#ffd7b8" stroke-width="2.2" fill="none" stroke-linecap="round"/>${brilho(38,30,7,3.5)}`,
];

const ARCO = `<circle cx="50" cy="50" r="38" fill="url(#gArco)"/><circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>
  <circle cx="50" cy="50" r="22" fill="#fff" opacity=".35"/>
  <path d="M50 30 L54 46 L70 50 L54 54 L50 70 L46 54 L30 50 L46 46Z" fill="#fff"/>${brilho(36,30,9,4)}`;

const CHOC = (hp) => `<rect x="10" y="10" width="80" height="80" rx="12" fill="url(#gChoc)"/>
  <rect x="17" y="17" width="30" height="30" rx="5" fill="#9a6440"/><rect x="53" y="17" width="30" height="30" rx="5" fill="#9a6440"/>
  <rect x="17" y="53" width="30" height="30" rx="5" fill="#9a6440"/><rect x="53" y="53" width="30" height="30" rx="5" fill="#9a6440"/>
  ${hp<2 ? '<path d="M30 12 L42 40 L34 52 L50 70 L44 88" stroke="#2a1408" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M60 14 L56 34 L70 46" stroke="#2a1408" stroke-width="3" fill="none"/>' : ''}`;

const ANEL = `<circle cx="50" cy="50" r="46" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="10 8" class="anel"/>`;

function svgDoce(c){
  if (!c) return '';
  if (c.choc) return `<svg viewBox="0 0 100 100">${CHOC(c.choc)}</svg>`;
  if (c.esp==='arco') return `<svg viewBox="0 0 100 100" class="gira">${ARCO}</svg>`;
  return `<svg viewBox="0 0 100 100">${DOCES[c.t]}${c.esp==='bomba'?ANEL:''}</svg>`;
}
const svgTipo = t => `<svg viewBox="0 0 100 100">${DOCES[t]}</svg>`;
const NOMES = ['Bala de morango','Ursinho de goma','Estrelinha','Pirulito','Rosquinha','Brigadeiro'];
const CORES_DOCE = ['#ff4d6a','#5fd35a','#ffd93b','#46a8ff','#ff7ec0','#8a5634'];
