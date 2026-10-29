// Sketch only: the nine stars' front views, drawn in the game's chibi units and conventions.
const INK = '#4A2E22'
const LINE = `stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"`
const THIN = `stroke="${INK}" stroke-width=".8" stroke-linejoin="round"`
const FINE = `stroke="${INK}" stroke-width="0.9" stroke-linecap="round" fill="none"`
const EYE = '#2B201C'
const GOLD = '#E3A73B'
const RED = '#D8463A'
const CREAM = '#FBF7EE'
const SILVER = '#C9CED6'
const SHINE = 'stroke="#ffffff" stroke-opacity=".7" stroke-width=".9" stroke-linecap="round"'
const BLUSH = '<ellipse rx="2.2" ry="1.2" fill="#F09A86" opacity=".75"'

const twoTone = (d, color, w = 1.1) =>
  `<path d="${d}" stroke="${INK}" stroke-width="${w + 1.4}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
  `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
/** Keeps what is drawn inside the body's outline. */
const onBody = (id, inner) =>
  `<clipPath id="${id}"><rect x="-8.35" y="0.65" width="16.7" height="16.7" rx="6.35"/></clipPath><g clip-path="url(#${id})">${inner}</g>`
const sparkle = (x, y, s, fill = '#ffffff') =>
  `<path d="M${x},${y - s} L${x + s * 0.28},${y - s * 0.28} L${x + s},${y} L${x + s * 0.28},${y + s * 0.28} L${x},${y + s} L${x - s * 0.28},${y + s * 0.28} L${x - s},${y} L${x - s * 0.28},${y - s * 0.28}Z" fill="${fill}"/>`
/** A daisy of `n` long white petals round a gold heart. */
const daisy = (cx, cy, r, n) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i * 360) / n
    return `<ellipse cx="${cx}" cy="${cy - r * 0.55}" rx="${r * 0.2}" ry="${r * 0.48}" transform="rotate(${a} ${cx} ${cy})" fill="#ffffff" stroke="${INK}" stroke-width=".6"/>`
  }).join('') + `<circle cx="${cx}" cy="${cy}" r="${r * 0.34}" fill="${GOLD}" stroke="${INK}" stroke-width=".7"/>`

// Taylor Swift: honey-blond long hair under straight bangs, red lips, a periwinkle top sewn with sequins
const TAYLOR_HAIR = '#E9C46A'
const bangs = (color) =>
  `<path d="M-10.6,-2.4 Q-10.4,-11 0,-11.2 Q10.4,-11 10.6,-2.4 Q9.2,-0.8 7.8,-2.2 Q6.4,-0.4 4.8,-2 Q3.2,-0.2 1.6,-1.8 Q0,-0.2 -1.6,-1.8 Q-3.2,-0.2 -4.8,-2 Q-6.4,-0.4 -7.8,-2.2 Q-9.2,-0.8 -10.6,-2.4Z" fill="${color}" ${LINE}/>`
const redLips = `<path d="M-2.3,5.4 Q-1.2,4.4 0,5.1 Q1.2,4.4 2.3,5.4 Q1.3,7.6 0,7.6 Q-1.3,7.6 -2.3,5.4Z" fill="${RED}" ${THIN}/><path d="M-1.6,5.8 Q0,6.4 1.6,5.8" stroke="#A8302A" stroke-width=".5" fill="none"/>`
const sequins = onBody(
  'seq',
  [[-5, 4, 1.6], [3.6, 3, 1.2], [5.4, 9, 1.7], [-3, 10, 1.3], [0.6, 14.6, 1.6], [-6, 15, 1], [6, 15.6, 1]].map(([x, y, s]) => sparkle(x, y, s)).join('') +
    [[-1.2, 6.6], [2, 8.4], [-6.4, 8], [3.2, 12.2], [-2.6, 15.6], [6.6, 5.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" fill="#E9EEFB"/>`).join(''),
) + `<path d="M-3.6,0.2 Q0,4.6 3.6,0.2" ${FINE}/>`

// The Weeknd: a red suit with darker lapels over a black shirt, a thin moustache and a chin beard
const redSuit =
  `<path d="M-3.8,-0.2 L0,7 L3.8,-0.2Z" fill="${EYE}" ${LINE}/>` +
  `<path d="M-3.8,-0.2 L-0.4,9.6 L-6.4,4.6 Z M3.8,-0.2 L0.4,9.6 L6.4,4.6 Z" fill="#9E2530" ${LINE}/>` +
  `<circle cx="1.6" cy="12" r=".8" fill="${EYE}"/><circle cx="1.6" cy="15" r=".8" fill="${EYE}"/>`
const moustache =
  `<path d="M-3.8,4.7 Q-2,3.3 0,4.2 Q2,3.3 3.8,4.7 Q2,4.6 0,4.9 Q-2,4.6 -3.8,4.7Z" fill="${EYE}"/>` +
  `<path d="M-1.4,8.6 Q0,9.8 1.4,8.6" stroke="${EYE}" stroke-width="1.5" stroke-linecap="round" fill="none"/>`

// Justin Bieber: a butter-yellow hoodie, its hood round the neck, cream drawstrings and a front pocket; a charcoal beanie
const HOODIE = '#F2D16B'
const HOODIE_DARK = '#E2B94A'
const hoodie =
  onBody('hood', `<path d="M-7.4,12 H7.4 L8.6,18 H-8.6Z" fill="${HOODIE_DARK}" ${LINE}/>`) +
  `<path d="M-8.4,2.4 Q-9.6,-1.8 -4.8,-1.6 Q0,2.8 4.8,-1.6 Q9.6,-1.8 8.4,2.4 Q0,7.2 -8.4,2.4Z" fill="${HOODIE_DARK}" ${LINE}/>` +
  twoTone('M-2.2,3.6 V9.4 M2.2,3.6 V9.4', CREAM, 0.8)
const beanie =
  `<path d="M-11.8,-3.4 Q-12.8,-16.4 0,-16.8 Q12.8,-16.4 11.8,-3.4Z" fill="#4A4E57" ${LINE}/>` +
  `<path d="M-4,-15.6 Q-3.4,-10 -3.6,-6.6 M4,-15.6 Q3.4,-10 3.6,-6.6 M0,-16.6 V-6.8" stroke="#3A3D45" stroke-width=".8" fill="none"/>` +
  `<path d="M-12.4,-7 Q0,-9.6 12.4,-7 L12.2,-2.4 Q0,-5 -12.2,-2.4Z" fill="#5C616B" ${LINE}/>` +
  `<path d="M-8.6,-7.6 V-3.4 M-4.4,-8.4 V-4.2 M0,-8.6 V-4.4 M4.4,-8.4 V-4.2 M8.6,-7.6 V-3.4" stroke="#474B54" stroke-width=".8" fill="none"/>`

// G-Dragon: pink hair, an all-black outfit with a big white daisy on the chest, gold hoops at the ears
const daisyPin = daisy(-3.6, 6.6, 4.6, 11)
const hoops = twoTone('M-12.2,4.2 a1.4,1.4 0 1 0 2.8,0 a1.4,1.4 0 1 0 -2.8,0 M9.4,4.2 a1.4,1.4 0 1 0 2.8,0 a1.4,1.4 0 1 0 -2.8,0', GOLD, 0.7)

// Taeyang: a tall black mohawk over shaved sides, a white tank and a silver chain with a tag
const mohawk =
  `<path d="M-3.2,-9.4 L-4,-14.6 L-1.8,-13.6 L-1.8,-19.4 L0.2,-16.4 L1.6,-20.6 L2.4,-15.4 L4.2,-16.2 L3.2,-9.4 Q0,-8.4 -3.2,-9.4Z" fill="${EYE}" ${LINE}/>` +
  `<path d="M-0.8,-10.4 V-15.2 M1.4,-10.4 Q1.6,-13.4 1.8,-16" stroke="#5A4A44" stroke-width=".8" fill="none" stroke-linecap="round"/>`
const tankChain =
  `<path d="M-5.6,0.4 Q-4.4,3.6 -6.6,6.4 M5.6,0.4 Q4.4,3.6 6.6,6.4" ${FINE}/>` +
  twoTone('M-3.8,0.8 Q0,8.6 3.8,0.8', SILVER, 0.7) +
  `<rect x="-1.3" y="7" width="2.6" height="3.6" rx=".7" fill="${SILVER}" ${THIN}/>`

// Daesung: the crescent-eyed grin, a navy suit, a white collar and a red bow tie
const grin =
  `<path d="M-5.8,2.8 Q-4,0.4 -2.2,2.8 M2.2,2.8 Q4,0.4 5.8,2.8" stroke="${EYE}" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
  `${BLUSH} cx="-7" cy="5.4"/>${BLUSH} cx="7" cy="5.4"/>` +
  `<path d="M-3,4.8 Q0,5.6 3,4.8 Q2.4,9 0,9 Q-2.4,9 -3,4.8Z" fill="#B8443A" ${THIN}/><path d="M-1.4,7.8 Q0,7 1.4,7.8 Q0,8.8 -1.4,7.8Z" fill="#F09A86"/>`
const bowTieSuit =
  `<path d="M-3.6,-0.2 L0,6 L3.6,-0.2Z" fill="${CREAM}" ${LINE}/>` +
  `<path d="M-3.6,-0.2 L-0.4,8.6 L-6,4.4 Z M3.6,-0.2 L0.4,8.6 L6,4.4 Z" fill="#24304D" ${LINE}/>` +
  `<path d="M0,1.8 L-3.6,0.2 L-3.6,3.6Z M0,1.8 L3.6,0.2 L3.6,3.6Z" fill="${RED}" ${THIN}/><circle cx="0" cy="1.8" r="1" fill="#A8302A" ${THIN}/>`

// HIEUTHUHAI: a black cap worn backwards, the strap's gap over the forehead, and a cream jersey with a cobalt 2
const COBALT = '#2D5FA8'
const backCap = (hairColor) =>
  `<path d="M-11.6,-7.6 Q-12.2,-19 0,-19.4 Q12.2,-19 11.6,-7.6 Q0,-10 -11.6,-7.6Z" fill="${COBALT}" ${LINE}/>` +
  `<path d="M-3.4,-8.8 Q-3.4,-12.8 0,-12.8 Q3.4,-12.8 3.4,-8.8Z" fill="${hairColor}" ${THIN}/>` +
  `<path d="M-4.8,-13.4 H4.8" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M-4.8,-13.4 H4.8" stroke="${CREAM}" stroke-width="1" stroke-linecap="round"/>` +
  `<path d="M-7,-17.6 Q-3.8,-13.6 -4.2,-9.4 M7,-17.6 Q3.8,-13.6 4.2,-9.4" stroke="#1E3F70" stroke-width=".7" fill="none"/>` +
  `<circle cx="0" cy="-19" r="1.1" fill="${COBALT}" ${THIN}/>`
const jersey =
  twoTone('M-3.6,0.4 L0,4.6 L3.6,0.4', COBALT, 1) +
  twoTone('M-2.4,8.4 Q-2.2,6.2 0.2,6.2 Q2.6,6.2 2.6,8.2 Q2.6,10 -2.4,14.4 H2.8', COBALT, 1.5)

// Sơn Tùng M-TP: a high swept quiff, an open black jacket over a white tee, and a gold chain
const quiff = (color) =>
  `<path d="M-10.8,-4.6 Q-12.4,-13 -6.2,-16.8 Q0,-21 7.6,-18.4 Q11.8,-16.4 11.2,-11 Q8.8,-13.6 4.6,-13.2 Q10,-10.6 11,-5.4 Q6,-9.6 0,-9.4 Q-6.2,-9.2 -10.8,-4.6Z" fill="${color}" ${LINE}/>` +
  `<path d="M-5.6,-12.4 Q0,-17.4 6.8,-16.2 M-2.4,-10.6 Q2,-13.6 6,-13" stroke="#5A4A44" stroke-width=".8" fill="none" stroke-linecap="round"/>`
const goldChainJacket =
  `<path d="M-3.8,-0.2 L-1.6,17.6 H1.6 L3.8,-0.2Z" fill="${CREAM}" ${LINE}/>` +
  `<path d="M-3.8,-0.2 L-1.4,9 L-6.4,4.6 Z M3.8,-0.2 L1.4,9 L6.4,4.6 Z" fill="#3A302C" ${LINE}/>` +
  twoTone('M-3.4,0.6 Q0,7.6 3.4,0.6', GOLD, 0.8) +
  `<circle cx="0" cy="5.4" r="1.2" fill="${GOLD}" ${THIN}/>`

// Jennie: long black hair with bangs and a cream bow, and a cream tweed jacket with black trim and gold buttons
const bow =
  `<path d="M6.6,-9.6 Q3,-13.6 2.8,-9.4 Q3,-6.4 6.6,-9.6Z M6.6,-9.6 Q10.6,-13.4 10.8,-9.2 Q10.4,-6.4 6.6,-9.6Z" fill="${CREAM}" ${LINE}/>` +
  `<path d="M6.2,-9.2 L4.8,-5 M7,-9.2 L8.8,-5.4" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="M6.2,-9.2 L4.8,-5 M7,-9.2 L8.8,-5.4" stroke="${CREAM}" stroke-width="1" stroke-linecap="round"/>` +
  `<circle cx="6.6" cy="-9.6" r="1.3" fill="${CREAM}" ${THIN}/>`
const tweed =
  onBody(
    'tweed',
    Array.from({ length: 26 }, (_, i) => `<circle cx="${((i * 37) % 17) - 8}" cy="${1.5 + ((i * 53) % 16)}" r=".45" fill="#CDBBA2"/>`).join('') +
      `<path d="M-3.4,-0.2 Q0,4 3.4,-0.2" fill="${EYE}"/>`,
  ) +
  twoTone('M-3.4,0.2 L-1.4,17.4 M3.4,0.2 L1.4,17.4', EYE, 0.9) +
  twoTone('M-7,11.2 H-3.2 M3.2,11.2 H7', EYE, 0.9) +
  `<circle cx="-2.6" cy="7.4" r=".8" fill="${GOLD}" ${THIN}/><circle cx="2.6" cy="7.4" r=".8" fill="${GOLD}" ${THIN}/>`

/** Each star's colours, base hair style, the face if not the plain one, and what they wear. */
export const STARS = [
  {
    id: 'taylor', name: 'Taylor Swift', role: 'Ca sĩ Mỹ', service: 'Massage', skin: 0, hair: TAYLOR_HAIR, hairStyle: 1, shirt: '#B7C3EA',
    body: [sequins], face: [redLips], hairOn: [bangs(TAYLOR_HAIR)],
    marks: 'Tóc vàng mật ong có mái bằng, môi đỏ, áo đính kim sa',
    hello: 'Hi y’all! Tối nay chị diễn ba tiếng rưỡi, bóp vai giùm chị nha!',
  },
  {
    id: 'weeknd', name: 'The Weeknd', role: 'Ca sĩ Canada', service: 'Gội đầu', skin: 3, hair: '#2B201C', hairStyle: 2, shirt: '#C8323A',
    body: [redSuit], face: [moustache], hairOn: [],
    marks: 'Bộ vest đỏ, áo sơ mi đen, ria mép mỏng',
    hello: 'Hát tới khuya, ngủ chưa đủ giấc… Gội cho anh tỉnh ngủ nha.',
  },
  {
    id: 'bieber', name: 'Justin Bieber', role: 'Ca sĩ Canada', service: 'Đắp mặt nạ', skin: 0, hair: '#9A5B36', hairStyle: 2, shirt: HOODIE,
    body: [hoodie], face: [], hairOn: [beanie],
    marks: 'Áo hoodie vàng bơ, mũ len xám',
    hello: 'Yo! Bay qua đây mệt quá. Sorry nếu anh ngủ quên lúc đắp mặt nạ nha!',
  },
  {
    id: 'gd', name: 'G-Dragon', role: 'Ca sĩ Hàn, BIGBANG', service: 'Gội đầu', skin: 0, hair: '#F49AB4', hairStyle: 2, shirt: '#2E2624',
    body: [daisyPin], face: [hoops], hairOn: [],
    marks: 'Tóc hồng, đồ đen, hoa cúc trắng to trước ngực, khuyên vàng',
    hello: 'Annyeong! Gội nhẹ tay giùm anh, tóc hồng này mới nhuộm đó.',
  },
  {
    id: 'taeyang', name: 'Taeyang', role: 'Ca sĩ Hàn, BIGBANG', service: 'Massage', skin: 1, hair: '#6E5D55', hairStyle: 2, shirt: '#F4F1EA',
    body: [tankChain], face: [], hairOn: [mohawk],
    marks: 'Tóc mohawk dựng gai, hai bên cạo sát, áo ba lỗ trắng, dây chuyền bạc',
    hello: 'Tập nhảy cả ngày, lưng cứng đơ rồi. Massage giùm anh nha!',
  },
  {
    id: 'daesung', name: 'Daesung', role: 'Ca sĩ Hàn, BIGBANG', service: 'Đắp mặt nạ', skin: 0, hair: '#5B3A29', hairStyle: 2, shirt: '#2D3A5C',
    body: [bowTieSuit], faceOverride: grin, face: [], hairOn: [],
    marks: 'Nụ cười mắt cong, vest xanh đậm, nơ đỏ',
    hello: 'Hehe! Cười nhiều quá mỏi cả mặt, đắp mặt nạ cho anh nha!',
  },
  {
    id: 'hieuthuhai', name: 'HIEUTHUHAI', role: 'Rapper Việt Nam', service: 'Gội đầu', skin: 0, hair: '#2B201C', hairStyle: 2, shirt: CREAM,
    body: [jersey], face: [], hairOn: [backCap('#2B201C')],
    marks: 'Mũ lưỡi trai xanh đội ngược, áo đấu số 2 (thứ hai)',
    hello: 'Mai quay MV rồi, gội cho anh thơm tho bảnh bao nha!',
  },
  {
    id: 'sontung', name: 'Sơn Tùng M-TP', role: 'Ca sĩ Việt Nam', service: 'Massage', skin: 0, hair: '#2B201C', hairStyle: 2, shirt: '#2B2422',
    body: [goldChainJacket], face: [], hairOn: [quiff('#2B201C')],
    marks: 'Tóc vuốt cao, áo khoác đen mở, dây chuyền vàng',
    hello: 'Chào em! Anh vừa ra bài mới, chạy show mỏi vai quá trời.',
  },
  {
    id: 'jennie', name: 'Jennie', role: 'Ca sĩ Hàn, BLACKPINK', service: 'Đắp mặt nạ', skin: 0, hair: '#2B201C', hairStyle: 1, shirt: '#F3E9DA',
    body: [tweed], face: [], hairOn: [bangs('#2B201C'), bow],
    marks: 'Tóc đen dài có mái, nơ kem, áo khoác vải tweed viền đen',
    hello: 'Annyeong! Mai chị chụp bìa tạp chí, làm da chị sáng lên nha.',
  },
]
