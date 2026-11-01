// Chỉ để phác thảo (game không nạp file này): 4 hướng nét vẽ mới, cùng một bộ hình dáng, mỗi hướng một cách tô.
// Chạy: node docs/art/huong-net-ve.cjs docs/art/huong-net-ve
// Ra 12 file SVG: {aplus|water|wood|soft}-{owner|corner|pho}.svg
const fs = require('fs')
const path = require('path')
const OUT = process.argv[2]

// ---------- màu ----------
const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16))
const toHex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)) }
const dk = (c, t) => mix(c, '#3A2418', t) // tối về nâu ấm, không xám bẩn
const lt = (c, t) => mix(c, '#FFFFFF', t)

// bảng màu theo vai trò: game hiện tại (dùng cho A+ và D)
const BASE = {
  ink: '#4A2E22', skin: '#EBC3A0', hair: '#4A3226', teal: '#2F7D6E', pants: '#6B4027', shoe: '#2B201C', cream: '#FBF7EE',
  eye: '#2B201C', blush: '#F28CA0', white: '#FFFFFF', terracotta: '#C65D3B', gold: '#E3A73B', tileBase: '#F6ECDB', tileSeam: '#E2D3BC',
  cobalt: '#2D5FA8', wood: '#8A5634', woodDark: '#6B4027', woodLight: '#A86E45', plank: '#C99A6A', plankLine: '#A87A4E',
  water: '#BFE3F2', leaf: '#4E9A6B', leafLight: '#5FAE7B', soil: '#5B3A29', broth: '#E7B465', brothLight: '#F4D59A', noodle: '#FBF3E4',
  beef: '#C9604E', beefFat: '#F3C9C0', scallion: '#6DB36A', scallionPale: '#D4ECA8', chili: '#D8463A', seed: '#F6D7A0',
  lime: '#8DBB4E', limePale: '#DCEFB4', chopstick: '#C99A6A', steam: '#9FB8BF', tea: '#C98B4A', bg: '#FBF3E4',
}
// B: màu nước, nhạt và ngả giấy
const WATER = Object.fromEntries(Object.entries(BASE).map(([k, v]) => [k, k === 'ink' ? '#5A4034' : mix(v, '#F7EEDC', 0.18)]))
WATER.bg = '#F7F0E2'
// C: tranh khắc gỗ Đông Hồ, màu khoáng truyền thống
const WOOD = {
  ...BASE, ink: '#231815', skin: '#F1D3AE', hair: '#231815', teal: '#3F6E55', pants: '#5A3A26', shoe: '#231815', cream: '#F4EBD8',
  eye: '#231815', blush: '#C9574A', terracotta: '#B33A2B', gold: '#E0A43A', tileBase: '#F1E5CC', tileSeam: '#CDBA97', cobalt: '#2F4A7A',
  wood: '#7A4E2E', woodDark: '#55341F', woodLight: '#946240', plank: '#B98A5A', plankLine: '#8A6038', water: '#A9C8C9', leaf: '#4E7A3A',
  leafLight: '#6E9448', soil: '#3A2418', broth: '#D9A251', brothLight: '#EAC57E', noodle: '#F4EBD8', beef: '#B5523F', beefFat: '#E8C2AE',
  scallion: '#5E8C3A', scallionPale: '#C7D99A', chili: '#B33A2B', lime: '#7FA54A', limePale: '#D3E2A6', chopstick: '#B98A5A', steam: '#8FA3A3',
  tea: '#9C6A3A', bg: '#EFE3C8',
}

// ---------- hình học ----------
const E = (cx, cy, rx, ry) => `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${2 * rx},0 a${rx},${ry} 0 1,0 ${-2 * rx},0 Z`
const R = (x, y, w, h, r) => `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`
const f = n => Math.round(n * 10) / 10
/** Lá nhọn từ gốc (x,y), hướng a độ, dài L, bề ngang W. */
const leaf = (x, y, a, L, W) => {
  const r = (a * Math.PI) / 180, dx = Math.cos(r), dy = Math.sin(r), px = -dy, py = dx
  const mx = x + dx * L * 0.5, my = y + dy * L * 0.5, tx = x + dx * L, ty = y + dy * L
  return { d: `M${f(x)},${f(y)} Q${f(mx + px * W)},${f(my + py * W)} ${f(tx)},${f(ty)} Q${f(mx - px * W)},${f(my - py * W)} ${f(x)},${f(y)} Z`, rib: `M${f(x)},${f(y)} L${f(x + dx * L * 0.82)},${f(y + dy * L * 0.82)}` }
}
// lớp: shape (khối có viền), line (nét màu), cord (sợi hai lớp), ground (bóng sàn), spot (mảng không viền)
const S = (d, r, o = {}) => ({ t: 'shape', d, r, ln: 'o', ...o })
const L = (d, r, w, o = {}) => ({ t: 'line', d, r, w, ...o })
const Cd = (d, r, w) => ({ t: 'cord', d, r, w })
const G = d => ({ t: 'ground', d })
const P = (d, r, op = 1) => ({ t: 'spot', d, r, op })

// ---------- mẫu 1: chủ tiệm ----------
function owner() {
  const face = 'M110,112 C110,62 145,36 180,36 C215,36 250,62 250,112 C250,158 220,182 180,182 C140,182 110,158 110,112 Z'
  return [
    G(E(180, 336, 74, 13)),
    S('M100,120 C92,50 140,22 180,22 C220,22 268,50 260,120 C262,150 250,168 244,172 C248,140 246,110 240,96 L120,96 C114,110 112,140 116,172 C110,168 98,150 100,120 Z', 'hair', { sh: 'M236,40 C262,70 266,130 244,172 C248,140 246,110 240,96 Z' }),
    S('M150,268 L148,322 Q148,330 156,330 L172,330 Q178,330 178,322 L178,268 Z', 'pants', { ln: 'o', sh: 'M168,268 L178,268 L178,330 L168,330 Z' }),
    S('M182,268 L182,322 Q182,330 188,330 L204,330 Q212,330 212,322 L210,268 Z', 'pants', { sh: 'M200,268 L210,268 L212,330 L200,330 Z' }),
    S(E(162, 332, 18, 8), 'shoe', { ln: 'i' }), S(E(198, 332, 18, 8), 'shoe', { ln: 'i' }),
    S('M170,172 h20 v18 h-20 Z', 'skin', { ln: 'i', sh: 'M170,172 h20 v10 h-20 Z' }),
    S('M136,200 Q138,188 152,186 L208,186 Q222,188 224,200 L232,272 Q232,282 222,282 L138,282 Q128,282 128,272 Z', 'teal', {
      sh: 'M212,192 Q222,196 224,204 L232,272 Q232,282 222,282 L168,282 Q214,262 212,192 Z', hi: 'M144,198 Q150,192 160,192 L156,240 Q146,226 144,198 Z',
    }),
    L('M162,187 Q180,200 198,187', 'ink', 3.5), L('M180,196 V280', 'ink', 3),
    P(E(180, 210, 4, 4), 'cream'), P(E(180, 232, 4, 4), 'cream'), P(E(180, 254, 4, 4), 'cream'),
    L('M146,248 h22 v16 M192,248 h22 v16', 'ink', 3),
    S('M138,196 Q118,206 116,250 Q116,262 126,262 L136,262 Q140,232 148,212 Z', 'teal', { ln: 'o' }),
    S('M222,196 Q242,206 244,250 Q244,262 234,262 L224,262 Q220,232 212,212 Z', 'teal', { sh: 'M232,204 Q242,214 244,250 Q244,262 234,262 L230,262 Q236,232 232,204 Z' }),
    S(E(126, 268, 11, 10), 'skin', { ln: 'i' }), S(E(234, 268, 11, 10), 'skin', { ln: 'i', sh: E(240, 272, 8, 7) }),
    S(face, 'skin', { sh: 'M232,80 C246,98 250,120 246,138 C238,166 212,180 180,182 C214,168 238,140 232,80 Z', hi: E(136, 128, 10, 6) }),
    S('M112,104 C112,56 146,32 180,32 C214,32 248,56 248,104 C236,92 222,78 206,74 C200,88 186,96 170,96 C176,88 178,80 176,72 C160,86 136,96 112,104 Z', 'hair', {
      sh: 'M220,44 C240,58 248,80 248,104 C240,96 232,88 222,82 Z', hi: 'M136,60 C150,46 172,42 192,43 C176,48 156,56 142,68 Z',
    }),
    L('M142,106 Q152,100 162,104', 'ink', 4), L('M198,104 Q208,100 218,106', 'ink', 4),
    S(E(152, 126, 7.5, 10.5), 'eye', { ln: 'n' }), S(E(208, 126, 7.5, 10.5), 'eye', { ln: 'n' }),
    P(E(149.5, 121.5, 3, 3), 'white'), P(E(205.5, 121.5, 3, 3), 'white'), P(E(154, 131, 1.6, 1.6), 'white'), P(E(210, 131, 1.6, 1.6), 'white'),
    P(E(138, 148, 14, 7), 'blush', 0.55), P(E(222, 148, 14, 7), 'blush', 0.55),
    L('M179,138 q-2,5 2,7', 'ink', 2.5), L('M168,152 Q180,163 192,152', 'ink', 3.5),
  ]
}

// ---------- mẫu 2: góc tiệm nhìn từ trên ----------
function corner() {
  const out = []
  const s = 72
  for (let ty = 0; ty < 5; ty++) for (let tx = 0; tx < 5; tx++) {
    const x = tx * s, y = ty * s, q = s * 0.25
    out.push(P(`M${x},${y} h${s} v${s} h${-s} Z`, 'tileBase'))
    out.push(P(`M${x},${y} h${q} a${q},${q} 0 0 1 ${-q},${q} Z M${x + s},${y} v${q} a${q},${q} 0 0 1 ${-q},${-q} Z M${x},${y + s} v${-q} a${q},${q} 0 0 1 ${q},${q} Z M${x + s},${y + s} h${-q} a${q},${q} 0 0 1 ${q},${-q} Z`, 'terracotta'))
    for (const a of [-90, 0, 90, 180]) out.push(P(leaf(x + s / 2, y + s / 2, a, s * 0.3, s * 0.1).d, 'teal'))
    out.push(P(E(x + s / 2, y + s / 2, s * 0.05, s * 0.05), 'gold'))
    const m = s * 0.055
    out.push(P(`M${x + s / 2},${y} l${m},${m} l${-m},${m} l${-m},${-m} Z M${x + s / 2},${y + s} l${m},${-m} l${-m},${-m} l${-m},${m} Z M${x},${y + s / 2} l${m},${-m} l${m},${m} l${-m},${m} Z M${x + s},${y + s / 2} l${-m},${-m} l${-m},${m} l${m},${m} Z`, 'gold'))
    out.push(L(`M${x},${y} h${s} v${s}`, 'tileSeam', 1.6))
  }
  // giường gội: chậu sứ ở đầu, khung gỗ, nệm xanh ngọc, gối, khăn
  out.push(G(R(68, 30, 92, 290, 16)))
  out.push(S(R(56, 300, 88, 18, 8), 'woodDark', { ln: 'o' }))
  out.push(S(R(56, 64, 88, 244, 14), 'wood', { sh: 'M128,64 H130 A14,14 0 0 1 144,78 V294 A14,14 0 0 1 130,308 H128 Z', hi: 'M64,72 H136 V78 H64 Z' }))
  out.push(S(R(66, 74, 68, 222, 12), 'teal', { ln: 'i', sh: 'M120,74 H122 A12,12 0 0 1 134,86 V284 A12,12 0 0 1 122,296 H120 Z' }))
  out.push(L('M70,150 H130 M70,206 H130', 'ink', 2.5, { op: 0.45 }))
  out.push(P(E(84, 178, 2.5, 2.5), 'cream'), P(E(116, 178, 2.5, 2.5), 'cream'), P(E(84, 234, 2.5, 2.5), 'cream'), P(E(116, 234, 2.5, 2.5), 'cream'))
  out.push(S(R(72, 80, 56, 32, 13), 'cream', { ln: 'i', sh: 'M112,80 H115 A13,13 0 0 1 128,93 V99 A13,13 0 0 1 115,112 H112 Z' }))
  out.push(S(R(70, 248, 60, 36, 6), 'terracotta', { ln: 'i', sh: 'M70,274 H130 V278 A6,6 0 0 1 124,284 H76 A6,6 0 0 1 70,278 Z' }))
  out.push(L('M74,258 H126 M74,266 H126', 'cream', 3))
  out.push(S(R(52, 16, 96, 56, 20), 'cream', { sh: 'M52,56 H148 V52 A20,20 0 0 1 128,72 H72 A20,20 0 0 1 52,52 Z' }))
  out.push(S(E(100, 40, 32, 15), 'water', { ln: 'i', hi: E(88, 35, 10, 4) }))
  out.push(L('M60,62 H140', 'cobalt', 4))
  out.push(S(E(100, 22, 5, 5), 'gold', { ln: 'i' }))
  // chậu cây
  out.push(G(E(282, 172, 44, 13)))
  out.push(S('M240,116 L250,164 Q278,178 306,164 L316,116 Z', 'terracotta', { sh: 'M292,116 L316,116 L306,164 Q298,169 290,171 Z' }))
  out.push(L('M246,138 Q278,150 310,138', 'gold', 4))
  out.push(S(E(278, 116, 40, 14), 'terracotta', { hi: E(262, 110, 10, 3) }))
  out.push(S(E(278, 117, 32, 9), 'soil', { ln: 'i' }))
  for (const [a, Ln, W, r] of [[-168, 64, 13, 'leaf'], [-140, 82, 15, 'leafLight'], [-114, 96, 15, 'leaf'], [-88, 92, 14, 'leafLight'], [-62, 94, 15, 'leaf'], [-36, 80, 15, 'leafLight'], [-10, 62, 13, 'leaf']]) {
    const l = leaf(278, 114, a, Ln, W)
    out.push(S(l.d, r, { ln: 'i' }))
    out.push(L(l.rib, 'ink', 2, { op: 0.5 }))
  }
  // bàn trà với ấm và chén
  out.push(G(R(230, 232, 110, 84, 12)))
  out.push(S(R(222, 288, 104, 18, 8), 'woodDark'))
  out.push(S(R(222, 222, 104, 76, 12), 'wood', { sh: 'M310,222 H314 A12,12 0 0 1 326,234 V286 A12,12 0 0 1 314,298 H310 Z', hi: 'M230,228 H318 V233 H230 Z' }))
  out.push(L('M232,250 H316 M232,272 H316', 'woodDark', 2, { op: 0.5 }))
  out.push(L('M240,248 C228,250 228,266 240,268', 'cream', 5))
  out.push(S('M276,256 L294,244 L297,249 L279,263 Z', 'cream', { ln: 'i' }))
  out.push(S(E(258, 258, 21, 18), 'cream', { sh: 'M266,242 C278,248 282,264 272,272 C264,276 254,277 246,275 C262,270 272,258 266,242 Z', hi: E(250, 251, 6, 4) }))
  out.push(L('M238,264 Q258,272 278,264', 'cobalt', 3.5))
  out.push(S(E(258, 245, 10, 4.5), 'cream', { ln: 'i' }), S(E(258, 241, 3.5, 3.5), 'gold', { ln: 'i' }))
  out.push(S(E(302, 282, 10, 7), 'cream', { ln: 'i' }), P(E(302, 281, 6.5, 4), 'tea'))
  out.push(S(E(240, 288, 10, 7), 'cream', { ln: 'i' }), P(E(240, 287, 6.5, 4), 'tea'))
  return out
}

// ---------- mẫu 3: tô phở ----------
function pho() {
  const out = []
  out.push(P('M0,206 H360 V360 H0 Z', 'plank'))
  out.push(L('M0,252 H360 M0,306 H360', 'plankLine', 3), L('M70,206 V252 M250,252 V306 M140,306 V360', 'plankLine', 2.5))
  out.push(G(E(186, 306, 118, 19)))
  // đũa trên bàn
  out.push(S('M190,326 L350,286 L353,295 L193,336 Z', 'chopstick', { ln: 'i' }))
  out.push(S('M204,338 L352,302 L354,311 L207,347 Z', 'chopstick', { ln: 'i' }))
  // tô sứ xanh trắng
  out.push(S(E(180, 302, 46, 9), 'cream', { ln: 'i' }))
  out.push(S('M42,150 C46,246 112,300 180,300 C248,300 314,246 318,150 Z', 'cream', {
    sh: 'M318,150 C314,246 248,300 180,300 C236,284 298,236 302,150 Z', hi: 'M68,176 C74,214 90,240 110,256 C94,236 82,212 78,180 Z',
  }))
  out.push(L('M58,204 C90,256 270,256 302,204', 'cobalt', 9), L('M120,282 C150,292 210,292 240,282', 'cobalt', 4))
  for (const [x, y] of [[96, 236], [140, 250], [220, 250], [264, 236]]) out.push(P(E(x, y + 12, 4, 4), 'cobalt'))
  out.push(S(E(180, 150, 138, 40), 'cream', { hi: 'M60,140 C90,122 150,114 190,114 C150,120 100,128 66,146 Z' }))
  // nước dùng
  out.push(S(E(180, 154, 124, 32), 'broth', { ln: 'i', sh: 'M56,154 C70,124 290,124 304,154 C288,138 72,138 56,154 Z' }))
  for (const [x, y, a, b] of [[106, 164, 8, 3], [138, 174, 5, 2], [244, 172, 7, 2.5], [276, 154, 5, 2], [96, 146, 4, 1.6]]) out.push(P(E(x, y, a, b), 'brothLight'))
  // bánh phở
  for (const d of ['M84,160 C100,146 124,150 136,160 S170,170 186,158', 'M92,170 C112,160 132,166 150,172 S188,176 204,166', 'M100,150 C118,140 142,142 158,150', 'M122,180 C140,174 164,180 182,184'])
    out.push(Cd(d, 'noodle', 7))
  // thịt bò tái, vân mỡ
  for (const [d, m] of [
    ['M190,150 C204,132 244,128 266,140 C258,156 226,164 196,162 Z', 'M202,150 C220,142 238,144 254,140'],
    ['M206,166 C222,150 262,148 282,160 C272,176 240,182 212,178 Z', 'M218,168 C236,160 252,164 270,158'],
    ['M174,168 C186,152 218,152 232,162 C224,174 202,180 180,178 Z', 'M184,168 C196,162 210,164 222,162'],
  ]) {
    const [x0, y0] = d.slice(1).split(/[ ,C]/).map(Number)
    out.push(S(d, 'beef', { ln: 'i', hi: E(x0 + 34, y0 - 5, 12, 2.5) }))
    out.push(L(m, 'beefFat', 2.5))
  }
  // hành lá, ngò, ớt
  for (const [x, y] of [[124, 146], [150, 136], [104, 166], [214, 188], [252, 176], [176, 142]]) {
    out.push(S(E(x, y, 7, 4.5), 'scallion', { ln: 'i' }))
    out.push(P(E(x, y, 3.5, 2.2), 'scallionPale'))
  }
  for (const [x, y] of [[160, 190], [266, 182], [92, 150]]) for (const a of [-90, 30, 150]) out.push(S(leaf(x, y, a, 11, 5.5).d, 'leaf', { ln: 'i' }))
  for (const [x, y] of [[232, 194], [286, 168]]) {
    out.push(S(E(x, y, 8, 5), 'chili', { ln: 'i' }))
    out.push(P(E(x, y, 4.5, 2.6), 'seed'))
  }
  // lát chanh trên vành tô
  out.push(S('M282,134 C292,112 330,110 340,132 C322,140 300,140 282,134 Z', 'lime'))
  out.push(P('M290,132 C298,118 326,116 334,131 C318,136 302,136 290,132 Z', 'limePale'))
  out.push(L('M312,134 L300,121 M312,134 L312,117 M312,134 L324,121', 'lime', 2))
  // khói
  for (const d of ['M130,108 C116,88 146,74 132,50', 'M184,102 C170,78 204,66 188,38', 'M238,110 C226,90 252,78 240,56']) out.push(L(d, 'steam', 6, { op: 0.75 }))
  return out
}

// ---------- 4 cách tô ----------
let uid = 0
const clip = (d, body) => { const id = 'k' + uid++; return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${body}</g>` }

const STYLES = {
  // A+: viền nâu như cũ, thêm bóng phẳng nét cứng, điểm sáng, nét dày mỏng 3 cấp
  aplus: {
    pal: BASE, defs: '', bg: c => `<rect width="360" height="360" fill="${c.bg}"/>`,
    shape: (l, c) => {
      const col = c[l.r]
      let s = `<path d="${l.d}" fill="${col}"/>`
      if (l.sh) s += clip(l.d, `<path d="${l.sh}" fill="${dk(col, 0.16)}"/>`)
      if (l.hi) s += clip(l.d, `<path d="${l.hi}" fill="#fff" opacity=".45"/>`)
      if (l.ln !== 'n') s += `<path d="${l.d}" fill="none" stroke="${c.ink}" stroke-width="${l.ln === 'o' ? 6 : 3.5}" stroke-linejoin="round"/>`
      return s
    },
    line: (l, c) => `<path d="${l.d}" fill="none" stroke="${c[l.r]}" stroke-width="${l.w}" stroke-linecap="round" stroke-linejoin="round" opacity="${l.op ?? 1}"/>`,
    cord: (l, c) => `<path d="${l.d}" fill="none" stroke="${c.ink}" stroke-width="${l.w + 3.5}" stroke-linecap="round"/><path d="${l.d}" fill="none" stroke="${c[l.r]}" stroke-width="${l.w}" stroke-linecap="round"/>`,
    ground: (l, c) => `<path d="${l.d}" fill="${c.ink}" opacity=".18"/>`,
    spot: (l, c) => `<path d="${l.d}" fill="${c[l.r]}" opacity="${l.op}"/>`,
    wrap: s => s,
  },
  // B: màu nước trên giấy dó: mép loang, nét màu đậm cùng tông thay viền nâu, bóng mềm, vân giấy
  water: {
    pal: WATER,
    defs: `<filter id="wob" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="bleed" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="1.4"/></filter>
<filter id="soft3"><feGaussianBlur stdDeviation="3"/></filter><filter id="soft1"><feGaussianBlur stdDeviation="1.4"/></filter><filter id="soft5"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="8" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.33  0 0 0 0 0.24  1.3 0 0 0 -0.55"/></filter>`,
    bg: c => `<rect width="360" height="360" fill="${c.bg}"/>`,
    shape: (l, c) => {
      const col = c[l.r]
      let s = `<path d="${l.d}" fill="${col}" opacity=".93" filter="url(#wob)"/>`
      s += `<path d="${l.d}" fill="none" stroke="${dk(col, 0.14)}" stroke-width="5" opacity=".35" filter="url(#bleed)"/>`
      if (l.sh) s += clip(l.d, `<path d="${l.sh}" fill="${dk(col, 0.2)}" opacity=".5" filter="url(#soft3)"/>`)
      if (l.hi) s += clip(l.d, `<path d="${l.hi}" fill="#fff" opacity=".55" filter="url(#soft1)"/>`)
      if (l.ln !== 'n') s += `<path d="${l.d}" fill="none" stroke="${dk(col, 0.42)}" stroke-width="${l.ln === 'o' ? 2.4 : 1.6}" opacity=".8" stroke-linejoin="round" filter="url(#wob)"/>`
      return s
    },
    line: (l, c) => `<path d="${l.d}" fill="none" stroke="${l.r === 'ink' ? '#6A4A3A' : c[l.r]}" stroke-width="${l.w * 0.85}" stroke-linecap="round" opacity="${(l.op ?? 1) * 0.85}" filter="url(#wob)"/>`,
    cord: (l, c) => `<path d="${l.d}" fill="none" stroke="${dk(c[l.r], 0.3)}" stroke-width="${l.w + 2}" stroke-linecap="round" opacity=".4" filter="url(#wob)"/><path d="${l.d}" fill="none" stroke="${c[l.r]}" stroke-width="${l.w}" stroke-linecap="round" filter="url(#wob)"/>`,
    ground: (l, c) => `<path d="${l.d}" fill="${c.ink}" opacity=".16" filter="url(#soft5)"/>`,
    spot: (l, c) => `<path d="${l.d}" fill="${c[l.r]}" opacity="${l.op * 0.9}" filter="url(#wob)"/>`,
    wrap: s => s + `<rect width="360" height="360" fill="#fff" filter="url(#paper)" opacity=".22"/>`,
  },
  // C: tranh khắc gỗ Đông Hồ: viền mực dày gồ ghề, màu khoáng in lệch nhẹ, bóng bằng nét gạch chéo, nền giấy điệp
  wood: {
    pal: WOOD,
    defs: `<filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G"/></filter>
<pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="none"/><path d="M0,0 V7" stroke="#231815" stroke-width="2.2"/></pattern>
<pattern id="diep" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#EFE3C8"/><ellipse cx="6" cy="9" rx="1.6" ry=".8" fill="#fff" opacity=".9"/><ellipse cx="27" cy="4" rx="1.1" ry=".6" fill="#F7D98A"/><ellipse cx="18" cy="24" rx="1.8" ry=".7" fill="#fff" opacity=".8"/><ellipse cx="34" cy="31" rx="1.2" ry=".6" fill="#fff"/><ellipse cx="9" cy="35" rx="1" ry=".5" fill="#F7D98A"/></pattern>
<filter id="fiber" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.5" numOctaves="2" seed="4" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.2  1 0 0 0 -0.5"/></filter>`,
    bg: () => `<rect width="360" height="360" fill="url(#diep)"/><rect width="360" height="360" fill="#fff" filter="url(#fiber)" opacity=".35"/>`,
    shape: (l, c) => {
      const col = c[l.r]
      let s = `<path d="${l.d}" fill="${col}" transform="translate(2.5 2)" filter="url(#rough)"/>`
      if (l.sh) s += clip(l.d, `<path d="${l.sh}" fill="url(#hatch)" opacity=".55"/>`)
      if (l.ln !== 'n') s += `<path d="${l.d}" fill="none" stroke="${c.ink}" stroke-width="${l.ln === 'o' ? 7 : 4.2}" stroke-linejoin="round" filter="url(#rough)"/>`
      return s
    },
    line: (l, c) => `<path d="${l.d}" fill="none" stroke="${c[l.r]}" stroke-width="${l.w * 1.15}" stroke-linecap="round" opacity="${l.op ?? 1}" filter="url(#rough)"/>`,
    cord: (l, c) => `<path d="${l.d}" fill="none" stroke="${c.ink}" stroke-width="${l.w + 4.5}" stroke-linecap="round" filter="url(#rough)"/><path d="${l.d}" fill="none" stroke="${c[l.r]}" stroke-width="${l.w}" stroke-linecap="round" filter="url(#rough)"/>`,
    ground: l => `<path d="${l.d}" fill="url(#hatch)" opacity=".45"/>`,
    spot: (l, c) => `<path d="${l.d}" fill="${c[l.r]}" opacity="${l.op}" filter="url(#rough)"/>`,
    wrap: s => s,
  },
  // D: mềm bóng kiểu game di động: không viền nâu, đổ màu chuyển, bóng mềm, ánh bóng, đổ bóng nổi khối
  soft: {
    pal: BASE,
    defs: `<filter id="sb4"><feGaussianBlur stdDeviation="4"/></filter><filter id="sb2"><feGaussianBlur stdDeviation="1.6"/></filter><filter id="sb6"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="drop" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#6B4027" flood-opacity=".22"/></filter>
<linearGradient id="bgsoft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7EE"/><stop offset="1" stop-color="#FBE6D4"/></linearGradient>`,
    bg: () => `<rect width="360" height="360" fill="url(#bgsoft)"/>`,
    shape: (l, c) => {
      const col = c[l.r], id = 'g' + uid++
      let s = `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lt(col, 0.24)}"/><stop offset=".55" stop-color="${col}"/><stop offset="1" stop-color="${dk(col, 0.14)}"/></linearGradient>`
      s += `<path d="${l.d}" fill="url(#${id})"/>`
      if (l.sh) s += clip(l.d, `<path d="${l.sh}" fill="${dk(col, 0.22)}" opacity=".6" filter="url(#sb4)"/>`)
      if (l.hi) s += clip(l.d, `<path d="${l.hi}" fill="#fff" opacity=".8" filter="url(#sb2)"/>`)
      if (l.ln !== 'n') s += `<path d="${l.d}" fill="none" stroke="${dk(col, 0.3)}" stroke-width="1.6" opacity=".45" stroke-linejoin="round"/>`
      return s
    },
    line: (l, c) => `<path d="${l.d}" fill="none" stroke="${l.r === 'ink' ? '#7A5A48' : c[l.r]}" stroke-width="${l.r === 'ink' ? l.w * 0.8 : l.w}" stroke-linecap="round" stroke-linejoin="round" opacity="${(l.op ?? 1) * (l.r === 'ink' ? 0.8 : 1)}"/>`,
    cord: (l, c) => `<path d="${l.d}" fill="none" stroke="${dk(c[l.r], 0.22)}" stroke-width="${l.w + 2}" stroke-linecap="round" opacity=".5"/><path d="${l.d}" fill="none" stroke="${c[l.r]}" stroke-width="${l.w}" stroke-linecap="round"/>`,
    ground: (l, c) => `<path d="${l.d}" fill="${c.ink}" opacity=".2" filter="url(#sb6)"/>`,
    spot: (l, c) => `<path d="${l.d}" fill="${c[l.r]}" opacity="${l.op}"/>`,
    wrap: s => s,
  },
}

function render(layers, key, subject) {
  const st = STYLES[key], c = st.pal
  // mảng gạch và mặt bàn là nền, không đổ bóng nổi khối
  const body = layers.map(l => (l.t === 'shape' ? st.shape(l, c) : l.t === 'line' ? st.line(l, c) : l.t === 'cord' ? st.cord(l, c) : l.t === 'ground' ? st.ground(l, c) : st.spot(l, c))).join('\n')
  const lifted = key === 'soft' && subject === 'owner' ? `<g filter="url(#drop)">${body}</g>` : body
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360" width="360" height="360"><defs>${st.defs}</defs>${st.bg(c)}${st.wrap(lifted)}</svg>`
}

const SUBJECTS = { owner, corner, pho }
fs.mkdirSync(OUT, { recursive: true })
for (const key of Object.keys(STYLES)) for (const [name, fn] of Object.entries(SUBJECTS)) {
  uid = 0
  fs.writeFileSync(path.join(OUT, `${key}-${name}.svg`), render(fn(), key, name))
}
console.log('ok')
