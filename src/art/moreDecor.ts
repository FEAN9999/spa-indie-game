import { C } from './palette'

// Đợt đồ thêm cho spa và nhà hàng, cùng nét vẽ với furniture.ts: đồ đứng nhìn từ phía trước, viền mực, màu trong bảng màu.
// Đồ treo tường là tranh cao hai ô, chân là đường sàn, treo trong khoảng y 0.25 đến 1.6; thảm nhìn từ trên xuống, đúng bằng ô chiếm.
// Đồ dài xoay được có thêm hình dựng đứng của riêng nó.

const LINE = 0.05
const FINE = 0.03
const ink = (w = LINE) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`
/** Làm tròn toạ độ tính ra để SVG ngắn gọn. */
const f = (v: number) => +v.toFixed(3)
const line = (d: string, col: string, w: number) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`
const dot = (x: number, y: number, r: number, fill: string, w = 0.02) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${fill}" ${ink(w)}/>`
/** Cây đinh trên tường và sợi dây thả xuống (x, y). */
const hook = (x: number, top: number, y: number) => line(`M${x},${top} L${x},${y}`, C.ink, 0.025) + dot(x, top, 0.04, C.woodDark)
/** Một khúc tre thẳng, có đốt ở giữa. */
const pole = (x: number, y: number, w: number, h: number) =>
  rect(x, y, w, h, C.bamboo, `rx="${f(Math.min(w, h) / 2)}" ${ink(FINE)}`) +
  (w > h ? line(`M${f(x + w / 2)},${f(y + 0.02)} V${f(y + h - 0.02)}`, C.bambooDark, 0.02) : line(`M${f(x + 0.02)},${f(y + h / 2)} H${f(x + w - 0.02)}`, C.bambooDark, 0.02))

// ---------- Spa: ghế chờ ----------

// sofa nhung xanh: lưng nhung xanh có nút bấm, ba đệm ngồi, tay vịn cuộn tròn hai đầu và chân gỗ tiện
const sofaArm = (x: number) =>
  rect(x, 0.3, 0.28, 0.78, C.teal, `rx="0.1" ${ink()}`) + dot(x + 0.14, 0.36, 0.13, C.tealLight, 0.04)
const velvetSofa =
  rect(0.32, 1.02, 0.1, 0.28, C.woodDark, `rx="0.03" ${ink(0.025)}`) +
  rect(2.58, 1.02, 0.1, 0.28, C.woodDark, `rx="0.03" ${ink(0.025)}`) +
  rect(0.14, 0.05, 2.72, 0.56, C.teal, `rx="0.22" ${ink()}`) +
  [0.5, 0.9, 1.3, 1.7, 2.1, 2.5].map((x, i) => dot(x, i % 2 ? 0.24 : 0.36, 0.035, C.tealDark, 0.015)).join('') +
  [0, 1, 2].map(i => rect(f(0.3 + i * 0.8), 0.5, 0.78, 0.36, C.tealLight, `rx="0.12" ${ink(0.04)}`)).join('') +
  rect(0.2, 0.84, 2.6, 0.2, C.tealDark, `rx="0.06" ${ink(0.04)}`) +
  sofaArm(0.04) +
  sofaArm(2.68)

// sofa nhung xanh dựng đứng: lưng chạy dọc bên trái, ba đệm dọc theo mặt ngồi, nẹp trước bên phải, hai tay vịn ngang hai đầu
const velvetSofaTurned =
  rect(0.22, 3.08, 0.1, 0.22, C.woodDark, ink(0.025)) +
  rect(0.8, 3.08, 0.1, 0.22, C.woodDark, ink(0.025)) +
  rect(0.05, 0.1, 0.32, 2.96, C.teal, `rx="0.14" ${ink()}`) +
  [0.5, 1.2, 1.9, 2.6].map(y => dot(0.2, y, 0.035, C.tealDark, 0.015)).join('') +
  [0, 1, 2].map(i => rect(0.34, f(0.26 + i * 0.9), 0.56, 0.84, C.tealLight, `rx="0.12" ${ink(0.04)}`)).join('') +
  rect(0.86, 0.16, 0.18, 2.9, C.tealDark, `rx="0.06" ${ink(0.04)}`) +
  rect(0.03, 0.02, 1.04, 0.24, C.teal, `rx="0.1" ${ink(0.04)}`) +
  rect(0.03, 2.9, 1.04, 0.24, C.teal, `rx="0.1" ${ink(0.04)}`)

// ghế bành mây: lưng mây tròn đan ô, đệm kem, mặt trước và bốn chân mây
const rattanArmchair =
  `<defs><pattern id="rattan" width="0.14" height="0.14" patternUnits="userSpaceOnUse"><rect width="0.14" height="0.14" fill="${C.weave}"/><path d="M0,0.07 H0.14 M0.07,0 V0.14" stroke="${C.weaveLine}" stroke-width="0.022"/></pattern></defs>` +
  rect(0.18, 1.0, 0.08, 0.38, C.weaveLine, `rx="0.03" ${ink(0.025)}`) +
  rect(0.74, 1.0, 0.08, 0.38, C.weaveLine, `rx="0.03" ${ink(0.025)}`) +
  `<path d="M0.08,1.0 Q0.0,0.12 0.5,0.08 Q1.0,0.12 0.92,1.0Z" fill="url(#rattan)" ${ink()}/>` +
  `<path d="M0.2,0.86 Q0.16,0.28 0.5,0.24 Q0.84,0.28 0.8,0.86" fill="none" stroke="${C.weaveLine}" stroke-width="0.04"/>` +
  rect(0.14, 0.7, 0.72, 0.26, C.cream, `rx="0.1" ${ink(0.04)}`) +
  rect(0.1, 0.92, 0.8, 0.14, C.weaveLine, `rx="0.05" ${ink(0.035)}`)

// ---------- Spa: bàn và đồ trang trí ----------

/** Lọ mỹ phẩm nhỏ, đáy ở `base`. */
const bottle = (x: number, base: number, h: number, fill: string, cap: string) =>
  rect(x, f(base - h), 0.12, h, fill, `rx="0.03" ${ink(0.02)}`) + rect(f(x + 0.03), f(base - h - 0.06), 0.06, 0.07, cap, ink(0.015))

// bàn trang điểm: bàn gỗ có ngăn kéo, gương bầu dục khung vàng đứng trên mặt bàn, lọ mỹ phẩm và lọ hoa
const vanityMirror = (cx: number, cy: number, rx: number, ry: number) =>
  rect(f(cx - 0.04), f(cy + ry - 0.02), 0.08, 0.14, C.mustardDark, ink(0.02)) +
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.mustard}" ${ink(0.04)}/>` +
  `<ellipse cx="${cx}" cy="${cy}" rx="${f(rx - 0.07)}" ry="${f(ry - 0.07)}" fill="${C.glass}" ${ink(0.02)}/>` +
  line(`M${f(cx - rx * 0.4)},${f(cy - ry * 0.1)} L${f(cx - rx * 0.1)},${f(cy - ry * 0.5)} M${f(cx - rx * 0.3)},${f(cy + ry * 0.2)} L${f(cx + rx * 0.1)},${f(cy - ry * 0.4)}`, '#FFFFFF', 0.03)
const vanity =
  rect(0.16, 0.94, 0.1, 0.48, C.woodDark, `rx="0.03" ${ink(0.03)}`) +
  rect(1.74, 0.94, 0.1, 0.48, C.woodDark, `rx="0.03" ${ink(0.03)}`) +
  vanityMirror(1.0, 0.36, 0.36, 0.32) +
  bottle(0.24, 0.8, 0.2, C.pinkPale, C.mustard) +
  bottle(0.42, 0.8, 0.14, C.mint, C.cream) +
  `<path d="M1.56,0.8 Q1.5,0.66 1.62,0.6 Q1.74,0.66 1.68,0.8Z" fill="${C.cobalt}" ${ink(0.02)}/>` +
  dot(1.58, 0.5, 0.06, C.lotus, 0.015) + dot(1.68, 0.46, 0.05, C.lotusDark, 0.015) +
  rect(0.05, 0.76, 1.9, 0.16, C.woodLight, `rx="0.06" ${ink()}`) +
  rect(0.12, 0.9, 1.76, 0.26, C.wood, `rx="0.05" ${ink(0.04)}`) +
  line('M1.0,0.92 V1.14', C.woodDark, 0.025) +
  dot(0.56, 1.03, 0.035, C.mustard, 0.015) + dot(1.44, 1.03, 0.035, C.mustard, 0.015)

// bàn trang điểm dựng đứng: mặt bàn chạy dọc, gương ở đầu xa, lọ mỹ phẩm dọc mặt bàn, chân và ngăn kéo ở đầu gần
const vanityTurned =
  rect(0.86, 0.5, 0.15, 1.5, C.wood, `rx="0.05" ${ink(0.035)}`) +
  rect(0.12, 1.98, 0.1, 0.3, C.woodDark, ink(0.025)) +
  rect(0.78, 1.98, 0.1, 0.3, C.woodDark, ink(0.025)) +
  rect(0.08, 0.5, 0.86, 1.5, C.woodLight, `rx="0.08" ${ink(0.04)}`) +
  vanityMirror(0.5, 0.42, 0.3, 0.3) +
  bottle(0.3, 1.2, 0.2, C.pinkPale, C.mustard) +
  bottle(0.56, 1.5, 0.14, C.mint, C.cream) +
  rect(0.12, 1.88, 0.78, 0.2, C.wood, `rx="0.05" ${ink(0.035)}`) +
  dot(0.5, 1.98, 0.035, C.mustard, 0.015)

// tủ hấp khăn: tủ trắng nhỏ cửa kính, trong là hai hàng khăn cuộn hồng và xanh, đèn đỏ ở bảng điều khiển, hơi nóng bốc lên
const towelRoll = (cx: number, cy: number, fill: string) =>
  dot(cx, cy, 0.085, fill, 0.02) + `<path d="M${f(cx - 0.035)},${cy} a0.035,0.035 0 1 1 0.035,0.035" fill="none" stroke="${C.ink}" stroke-width="0.012"/>`
const towelSteamer =
  line('M0.38,0.3 q-0.06,-0.08 0,-0.14 t0,-0.14 M0.62,0.3 q-0.06,-0.08 0,-0.14 t0,-0.14', C.steamBlue, 0.035) +
  rect(0.12, 0.34, 0.76, 1.08, C.cream, `rx="0.07" ${ink()}`) +
  rect(0.2, 0.44, 0.6, 0.66, C.glass, `rx="0.04" ${ink(FINE)}`) +
  line('M0.22,0.76 H0.78', C.tankRib, 0.025) +
  [0.32, 0.5, 0.68].map((x, i) => towelRoll(x, 0.62, i % 2 ? C.mint : C.pinkPale)).join('') +
  [0.32, 0.5, 0.68].map((x, i) => towelRoll(x, 0.94, i % 2 ? C.pinkPale : C.mint)).join('') +
  rect(0.2, 1.16, 0.6, 0.16, C.tank, `rx="0.03" ${ink(0.025)}`) +
  dot(0.32, 1.24, 0.035, C.lantern, 0.012) +
  rect(0.48, 1.21, 0.24, 0.06, C.tankRib, `rx="0.02"`) +
  rect(0.16, 1.4, 0.12, 0.08, C.tankRib, ink(0.02)) +
  rect(0.72, 1.4, 0.12, 0.08, C.tankRib, ink(0.02))

// máy xông tinh dầu: bàn tròn chân đơn bằng gỗ, trên là bình xông gốm hình giọt nước toả sương, cạnh đó một ngọn nến nhỏ
const aromaDiffuser =
  `<path d="M0.5,0.5 q-0.1,-0.1 -0.02,-0.2 t0.02,-0.22 M0.56,0.5 q0.1,-0.08 0.04,-0.18 t0.06,-0.18" stroke="${C.steamBlue}" stroke-width="0.04" fill="none" stroke-linecap="round" opacity="0.85"/>` +
  `<ellipse cx="0.5" cy="1.5" rx="0.26" ry="0.07" fill="${C.woodDark}" ${ink(0.03)}/>` +
  rect(0.45, 1.0, 0.1, 0.5, C.wood, ink(0.025)) +
  `<ellipse cx="0.5" cy="1.0" rx="0.38" ry="0.1" fill="${C.woodLight}" ${ink(0.04)}/>` +
  `<path d="M0.5,0.48 Q0.72,0.74 0.68,0.86 Q0.5,1.0 0.32,0.86 Q0.28,0.74 0.5,0.48Z" fill="${C.sand}" ${ink(0.035)}/>` +
  line('M0.36,0.86 Q0.5,0.92 0.64,0.86', C.wood, 0.04) +
  dot(0.5, 0.74, 0.04, C.mintTeal, 0.012) +
  rect(0.74, 0.86, 0.1, 0.12, C.cream, `rx="0.02" ${ink(0.015)}`) +
  `<path d="M0.79,0.85 q-0.04,-0.05 0,-0.1 q0.04,0.05 0,0.1Z" fill="${C.stoneHot}"/>`

// ---------- Dùng chung: thảm và đồ treo tường ----------

// thảm gạch bông: ô gạch bông kem, mỗi viên một hoa bốn cánh xanh, nhụy đỏ đất và góc vàng, viền xanh quanh thảm
const tileRug = (w: number, h: number) => {
  const s = 0.45
  const x0 = f((w - Math.floor((w - 0.2) / s) * s) / 2)
  const y0 = f((h - Math.floor((h - 0.2) / s) * s) / 2)
  const cells: string[] = []
  for (let y = y0; y + s <= h - 0.09; y += s) {
    for (let x = x0; x + s <= w - 0.09; x += s) {
      const cx = f(x + s / 2)
      const cy = f(y + s / 2)
      cells.push(
        rect(f(x), f(y), s, s, C.paper, `stroke="${C.tileSeam}" stroke-width="0.015"`) +
          `<path d="M${cx},${f(cy - 0.17)} Q${f(cx + 0.09)},${cy} ${cx},${f(cy + 0.17)} Q${f(cx - 0.09)},${cy} ${cx},${f(cy - 0.17)}Z M${f(cx - 0.17)},${cy} Q${cx},${f(cy + 0.09)} ${f(cx + 0.17)},${cy} Q${cx},${f(cy - 0.09)} ${f(cx - 0.17)},${cy}Z" fill="${C.teal}"/>` +
          `<circle cx="${cx}" cy="${cy}" r="0.045" fill="${C.terracotta}"/>` +
          `<path d="M${f(x)},${f(y + 0.07)} A0.07,0.07 0 0 0 ${f(x + 0.07)},${f(y)} L${f(x)},${f(y)}Z M${f(x + s)},${f(y + s - 0.07)} A0.07,0.07 0 0 0 ${f(x + s - 0.07)},${f(y + s)} L${f(x + s)},${f(y + s)}Z" fill="${C.mustard}"/>`,
      )
    }
  }
  return rect(0.06, 0.06, f(w - 0.12), f(h - 0.12), C.tealDark, `rx="0.08" ${ink(0.04)}`) + cells.join('')
}

// lịch bloc treo tường: tấm bìa đỏ viền vàng có tranh phong cảnh nhỏ, bên dưới là tập lịch xé với ngày đỏ to
const tearCalendar =
  hook(0.5, 0.24, 0.36) +
  rect(0.16, 0.36, 0.68, 1.16, C.lantern, `rx="0.04" ${ink()}`) +
  rect(0.16, 0.36, 0.68, 0.16, C.gold, `rx="0.04" ${ink(0.03)}`) +
  rect(0.26, 0.58, 0.48, 0.3, C.water, ink(0.02)) +
  `<path d="M0.26,0.88 L0.4,0.72 L0.5,0.8 L0.6,0.7 L0.74,0.88Z" fill="${C.leaf}" ${ink(0.015)}/>` +
  dot(0.64, 0.66, 0.04, C.gold, 0.01) +
  rect(0.25, 1.0, 0.52, 0.48, C.cream, ink(0.02)) +
  rect(0.23, 0.96, 0.52, 0.48, C.paper, ink(0.03)) +
  line('M0.31,1.04 H0.67', C.lantern, 0.03) +
  `<path d="M0.42,1.14 L0.5,1.1 V1.32 M0.42,1.32 H0.58" stroke="${C.lanternDark}" stroke-width="0.06" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
  line('M0.33,1.38 H0.65', C.soft, 0.02)

// ---------- Nhà hàng: bàn và ghế ăn ----------

/** Bát và ống đũa, như trên bàn ăn ở dining.ts. */
const bowl = (cx: number, cy: number) =>
  `<path d="M${f(cx - 0.15)},${f(cy - 0.1)} H${f(cx + 0.15)} Q${f(cx + 0.13)},${f(cy + 0.07)} ${cx},${f(cy + 0.07)} Q${f(cx - 0.13)},${f(cy + 0.07)} ${f(cx - 0.15)},${f(cy - 0.1)}Z" fill="${C.cream}" ${ink(FINE)}/>` +
  line(`M${f(cx - 0.11)},${f(cy - 0.05)} H${f(cx + 0.11)}`, C.cobalt, 0.022)
const chopsticks = (cx: number, cy: number) =>
  rect(f(cx - 0.06), f(cy - 0.1), 0.12, 0.14, C.terracotta, `rx="0.03" ${ink(0.022)}`) +
  line(`M${f(cx - 0.02)},${f(cy - 0.1)} L${f(cx - 0.05)},${f(cy - 0.3)} M${f(cx + 0.02)},${f(cy - 0.1)} L${f(cx + 0.06)},${f(cy - 0.29)}`, C.bambooDark, 0.028)

// bàn nhựa vỉa hè: bàn nhựa xanh dương vuông, thấp, có bát và ống đũa
const streetTable =
  rect(0.12, 0.66, 0.1, 0.5, C.cobalt, `rx="0.03" ${ink(0.03)}`) +
  rect(0.78, 0.66, 0.1, 0.5, C.cobalt, `rx="0.03" ${ink(0.03)}`) +
  rect(0.05, 0.4, 0.9, 0.3, C.houseSkyDark, `rx="0.08" ${ink()}`) +
  line('M0.14,0.5 H0.86', C.houseSky, 0.035) +
  rect(0.05, 0.64, 0.9, 0.1, C.cobalt, `rx="0.04" ${ink(0.03)}`) +
  bowl(0.36, 0.5) +
  chopsticks(0.7, 0.52)

// bàn tròn gia đình: mặt tròn gỗ có mâm xoay, nồi lẩu bốc hơi ở giữa, hai bát, chân trụ và đế chữ thập
const roundTable =
  `<ellipse cx="1.0" cy="2.06" rx="0.5" ry="0.09" fill="${C.woodDark}" ${ink(0.035)}/>` +
  rect(0.88, 1.36, 0.24, 0.72, C.woodDark, `rx="0.05" ${ink(0.035)}`) +
  `<ellipse cx="1.0" cy="1.06" rx="0.95" ry="0.5" fill="${C.woodDark}" ${ink()}/>` +
  `<ellipse cx="1.0" cy="0.98" rx="0.95" ry="0.5" fill="${C.wood}" ${ink()}/>` +
  `<ellipse cx="1.0" cy="0.98" rx="0.8" ry="0.4" fill="none" stroke="${C.woodLight}" stroke-width="0.04"/>` +
  `<ellipse cx="1.0" cy="0.98" rx="0.42" ry="0.2" fill="${C.woodLight}" ${ink(FINE)}/>` +
  `<path d="M0.72,0.8 H1.28 V0.98 Q1.0,1.1 0.72,0.98Z" fill="${C.tankRib}" ${ink(0.035)}/>` +
  `<ellipse cx="1.0" cy="0.8" rx="0.28" ry="0.07" fill="${C.lantern}" ${ink(0.025)}/>` +
  line('M0.9,0.72 q-0.06,-0.1 0,-0.2 t0,-0.2 M1.1,0.72 q-0.06,-0.1 0,-0.2 t0,-0.2', C.cloud, 0.035) +
  bowl(0.42, 1.0) +
  bowl(1.58, 1.0) +
  chopsticks(1.0, 1.3)

// ghế nhựa đỏ: ghế đẩu nhựa đỏ thấp, mặt có khe cầm, thân loe có vòm khoét
const plasticStool =
  `<path d="M0.22,0.6 L0.1,1.0 H0.9 L0.78,0.6Z" fill="${C.lantern}" ${ink(0.04)}/>` +
  `<path d="M0.32,1.0 Q0.5,0.72 0.68,1.0Z" fill="${C.lanternDark}" ${ink(0.025)}/>` +
  rect(0.12, 0.48, 0.76, 0.16, C.lantern, `rx="0.06" ${ink(0.04)}`) +
  rect(0.4, 0.53, 0.2, 0.05, C.lanternDark, `rx="0.025"`)

// ghế tre: lưng hai khúc tre có hai nan ngang, mặt ngồi đan mây, bốn chân tre có thanh giằng
const bambooChair =
  pole(0.22, 0.08, 0.1, 0.62) +
  pole(0.68, 0.08, 0.1, 0.62) +
  pole(0.24, 0.18, 0.52, 0.08) +
  pole(0.24, 0.38, 0.52, 0.08) +
  pole(0.2, 0.74, 0.1, 0.58) +
  pole(0.7, 0.74, 0.1, 0.58) +
  pole(0.24, 1.1, 0.52, 0.07) +
  rect(0.12, 0.6, 0.76, 0.18, C.weave, `rx="0.06" ${ink(0.04)}`) +
  line('M0.22,0.69 H0.78', C.weaveLine, 0.025)

// ---------- Nhà hàng: đồ trang trí ----------

// bảng thực đơn: bảng đen khung gỗ treo tường, phấn viết các dòng món, hình bát phở vẽ phấn và chấm giá vàng
const menuBoard =
  hook(1, 0.12, 0.3) + line('M0.3,0.34 L1,0.14 L1.7,0.34', C.ink, 0.02) +
  rect(0.2, 0.3, 1.6, 1.16, C.wood, `rx="0.06" ${ink()}`) +
  rect(0.3, 0.4, 1.4, 0.96, C.deepBrown, ink(FINE)) +
  line('M0.4,0.52 H1.0', C.cream, 0.04) +
  [0.68, 0.84, 1.0, 1.16].map((y, i) => line(`M0.42,${y} H${[0.98, 0.86, 1.02, 0.9][i]}`, C.cream, 0.025) + dot(1.12, y, 0.025, C.mustard, 0.01)).join('') +
  `<path d="M1.26,0.82 H1.62 Q1.6,1.04 1.44,1.06 Q1.28,1.04 1.26,0.82Z" fill="none" stroke="${C.cream}" stroke-width="0.025"/>` +
  line('M1.36,0.76 q-0.04,-0.06 0,-0.12 M1.48,0.76 q-0.04,-0.06 0,-0.12 M1.5,0.82 L1.64,0.6 M1.54,0.82 L1.7,0.62', C.cream, 0.02) +
  rect(0.6, 1.36, 0.8, 0.06, C.woodDark, `rx="0.02" ${ink(0.015)}`) +
  rect(0.7, 1.32, 0.14, 0.04, C.cream, `rx="0.01"`)

// tủ mát nước giải khát: tủ cao cửa kính, đầu tủ đỏ có sọc trắng, ba ngăn chai nước nhiều màu, tay nắm bạc
const BOTTLES = [C.stoneHot, C.leafLight, C.clay, C.lantern]
const fridgeShelf = (y: number, shift: number) =>
  rect(0.2, f(y + 0.28), 0.6, 0.03, C.tankRib) +
  [0.24, 0.38, 0.52, 0.66].map((x, i) => rect(x, f(y + 0.08), 0.1, 0.2, BOTTLES[(i + shift) % BOTTLES.length], `rx="0.03" ${ink(0.012)}`) + rect(f(x + 0.03), f(y + 0.03), 0.04, 0.06, C.cream, ink(0.01))).join('')
const drinkFridge =
  rect(0.1, 0.12, 0.8, 1.86, C.tank, `rx="0.06" ${ink()}`) +
  rect(0.1, 0.12, 0.8, 0.3, C.lantern, `rx="0.06" ${ink(0.04)}`) +
  `<path d="M0.18,0.3 Q0.34,0.2 0.5,0.28 T0.82,0.24" stroke="${C.cream}" stroke-width="0.04" fill="none" stroke-linecap="round"/>` +
  rect(0.16, 0.48, 0.68, 1.3, C.glass, `rx="0.04" ${ink(FINE)}`) +
  fridgeShelf(0.5, 0) + fridgeShelf(0.9, 1) + fridgeShelf(1.3, 2) +
  line('M0.22,0.56 L0.32,1.7', '#FFFFFF', 0.03) +
  rect(0.74, 0.9, 0.05, 0.4, C.silver, `rx="0.02" ${ink(0.015)}`) +
  rect(0.16, 1.82, 0.68, 0.1, C.tankRib, `rx="0.02" ${ink(0.02)}`)

// bình trà đá: bình nhựa to nắp đỏ đựng trà vàng có vòi, đứng trên ghế đẩu gỗ, cạnh là chồng ly đá
const iceGlass = (x: number, base: number) =>
  `<path d="M${x},${f(base - 0.2)} H${f(x + 0.16)} L${f(x + 0.14)},${base} H${f(x + 0.02)}Z" fill="${C.glass}" ${ink(0.018)}/>` +
  rect(f(x + 0.03), f(base - 0.14), 0.05, 0.05, C.cloud, `stroke="${C.tankRib}" stroke-width="0.01"`) +
  rect(f(x + 0.08), f(base - 0.1), 0.05, 0.05, C.cloud, `stroke="${C.tankRib}" stroke-width="0.01"`)
const icedTeaStand =
  rect(0.16, 1.06, 0.08, 0.38, C.woodDark, ink(0.025)) +
  rect(0.76, 1.06, 0.08, 0.38, C.woodDark, ink(0.025)) +
  rect(0.2, 1.3, 0.6, 0.06, C.woodDark, ink(0.02)) +
  rect(0.1, 0.98, 0.8, 0.1, C.wood, `rx="0.03" ${ink(0.035)}`) +
  rect(0.16, 0.36, 0.46, 0.62, C.glass, `rx="0.1" ${ink(0.04)}`) +
  rect(0.2, 0.52, 0.38, 0.42, C.mustard, `rx="0.07" opacity="0.85"`) +
  line('M0.24,0.58 V0.88', C.glow, 0.03) +
  rect(0.13, 0.28, 0.52, 0.12, C.lantern, `rx="0.04" ${ink(0.03)}`) +
  rect(0.33, 0.22, 0.12, 0.07, C.lanternDark, `rx="0.02" ${ink(0.02)}`) +
  rect(0.34, 0.86, 0.1, 0.08, C.lantern, `rx="0.02" ${ink(0.02)}`) +
  iceGlass(0.66, 0.98) +
  iceGlass(0.66, 0.78)

// ---------- Dùng chung: bể bơi ----------

// bể bơi: nhìn từ trên xuống, thành lát gạch kem, nước xanh có gợn sóng và vệt nắng, thang inox ở mép sau, phao bơi đỏ trắng
const PHAO = [C.lantern, C.cream, C.lantern, C.cream, C.lantern, C.cream, C.lantern, C.cream]
const pool =
  `<defs><pattern id="coping" width="0.26" height="0.26" patternUnits="userSpaceOnUse"><rect width="0.26" height="0.26" fill="${C.tile}"/><path d="M0,0.13 H0.26 M0.13,0 V0.26" stroke="${C.tileSeam}" stroke-width="0.02"/></pattern></defs>` +
  rect(0.06, 0.26, 3.88, 3.88, 'url(#coping)', `rx="0.12" ${ink()}`) +
  rect(0.32, 0.52, 3.36, 3.36, C.waterDeep, `rx="0.08" ${ink(0.04)}`) +
  rect(0.34, 0.54, 3.32, 0.22, C.cobalt, `opacity="0.25"`) +
  rect(0.34, 0.54, 0.2, 3.32, C.cobalt, `opacity="0.15"`) +
  [1.1, 1.7, 2.3, 2.9, 3.5].map((y, i) => line(`M${f(0.6 + (i % 2) * 0.3)},${y} q0.18,-0.08 0.36,0 t0.36,0 M${f(2.0 - (i % 2) * 0.2)},${f(y + 0.1)} q0.18,-0.08 0.36,0 t0.36,0`, C.water, 0.04)).join('') +
  line('M0.8,1.4 l0.5,-0.3 M2.6,3.1 l0.6,-0.32 M1.6,2.6 l0.3,-0.16', '#FFFFFF', 0.03) +
  // thang inox: hai tay vịn vòng qua mép sau, ba bậc chìm dưới nước
  [0.5, 0.8].map(d => rect(f(2.6 + 0.04), f(0.6 + d * 0.4), 0.36, 0.05, C.water, `opacity="0.9"`)).join('') +
  [2.6, 3.04].map(x => `<path d="M${x},1.05 V0.36 Q${x},0.12 ${f(x + 0.12)},0.16" stroke="${C.ink}" stroke-width="0.075" fill="none" stroke-linecap="round"/><path d="M${x},1.05 V0.36 Q${x},0.12 ${f(x + 0.12)},0.16" stroke="${C.silver}" stroke-width="0.045" fill="none" stroke-linecap="round"/>`).join('') +
  // phao bơi: tám múi đỏ trắng xen nhau
  PHAO.map((col, i) => {
    const a = (i * Math.PI) / 4
    const b = ((i + 1) * Math.PI) / 4
    const [cx, cy, ro, ri] = [1.25, 2.55, 0.34, 0.16]
    const p = (r: number, t: number) => `${f(cx + Math.cos(t) * r)},${f(cy + Math.sin(t) * r)}`
    return `<path d="M${p(ri, a)} L${p(ro, a)} A${ro},${ro} 0 0 1 ${p(ro, b)} L${p(ri, b)} A${ri},${ri} 0 0 0 ${p(ri, a)}Z" fill="${col}"/>`
  }).join('') +
  `<circle cx="1.25" cy="2.55" r="0.34" fill="none" ${ink(0.035)}/><circle cx="1.25" cy="2.55" r="0.16" fill="none" ${ink(0.025)}/>` +
  // quả bóng biển trôi gần thành phải
  dot(3.2, 2.0, 0.17, C.gold, 0.03) +
  `<path d="M3.2,1.83 Q3.06,2.0 3.2,2.17 M3.2,1.83 Q3.34,2.0 3.2,2.17" stroke="${C.lantern}" stroke-width="0.05" fill="none"/>`

// ---------- Nhà hàng: đồ tầng thượng ----------

/** Nệm sọc xanh kem dài `w`, góc trên trái ở (x, y). */
const stripedPad = (x: number, y: number, w: number, h: number) =>
  rect(x, y, w, h, C.cream, `rx="0.06" ${ink(0.035)}`) +
  Array.from({ length: Math.floor(w / 0.24) }, (_, i) => rect(f(x + 0.06 + i * 0.24), f(y + 0.02), 0.12, f(h - 0.04), C.tealLight)).join('') +
  rect(x, y, w, h, 'none', `rx="0.06" ${ink(0.035)}`)

// ghế tắm nắng: nhìn ngang, khung gỗ có lưng dựng nghiêng bên trái, nệm sọc xanh kem, khăn cuộn ở cuối ghế
const sunLounger =
  rect(0.3, 0.86, 0.08, 0.3, C.woodDark, ink(0.025)) +
  rect(0.82, 0.86, 0.08, 0.3, C.woodDark, ink(0.025)) +
  rect(1.78, 0.86, 0.08, 0.3, C.woodDark, ink(0.025)) +
  rect(0.24, 0.76, 1.7, 0.12, C.woodLight, `rx="0.04" ${ink(0.035)}`) +
  `<path d="M0.12,0.22 L0.3,0.14 L0.66,0.76 L0.46,0.82Z" fill="${C.woodLight}" ${ink(0.035)}/>` +
  `<path d="M0.2,0.2 L0.34,0.16 L0.64,0.66 L0.5,0.72Z" fill="${C.tealLight}" ${ink(0.025)}/>` +
  stripedPad(0.5, 0.6, 1.42, 0.17) +
  rect(1.56, 0.46, 0.3, 0.16, C.lotus, `rx="0.08" ${ink(0.025)}`) +
  line('M1.64,0.48 V0.6 M1.72,0.48 V0.6', C.lotusDark, 0.015)

// ghế tắm nắng dựng đứng: nhìn từ cuối ghế, nệm chạy dọc lên, lưng ghế dựng ở đầu xa, chân ở đầu gần
const sunLoungerTurned =
  rect(0.18, 2.02, 0.08, 0.26, C.woodDark, ink(0.025)) +
  rect(0.76, 2.02, 0.08, 0.26, C.woodDark, ink(0.025)) +
  rect(0.1, 0.5, 0.82, 1.56, C.woodLight, `rx="0.06" ${ink(0.04)}`) +
  rect(0.16, 0.16, 0.7, 0.46, C.woodLight, `rx="0.06" ${ink(0.04)}`) +
  rect(0.22, 0.22, 0.58, 0.36, C.tealLight, `rx="0.05" ${ink(0.025)}`) +
  rect(0.18, 0.62, 0.66, 1.36, C.cream, `rx="0.06" ${ink(0.03)}`) +
  [0.68, 0.92, 1.16, 1.4, 1.64].map(y => rect(0.2, y, 0.62, 0.12, C.tealLight)).join('') +
  rect(0.18, 0.62, 0.66, 1.36, 'none', `rx="0.06" ${ink(0.03)}`) +
  rect(0.26, 1.7, 0.5, 0.22, C.lotus, `rx="0.1" ${ink(0.025)}`)

// bếp nướng than: thùng sắt trên bốn chân, than hồng, vỉ nướng có hai xiên thịt, khói bay
const skewer = (y: number) =>
  line(`M0.16,${y} L0.84,${f(y - 0.04)}`, C.bambooDark, 0.025) +
  [0.3, 0.46, 0.62].map((x, i) => `<ellipse cx="${x}" cy="${f(y - 0.02 - i * 0.006)}" rx="0.07" ry="0.05" fill="${i % 2 ? C.clay : C.terracotta}" ${ink(0.015)}/>`).join('')
const charcoalGrill =
  line('M0.34,0.42 q-0.08,-0.1 0,-0.18 t0,-0.18 M0.6,0.4 q-0.08,-0.1 0,-0.18 t0,-0.18', C.steamBlue, 0.04) +
  rect(0.2, 0.96, 0.07, 0.46, C.stone, ink(0.025)) +
  rect(0.73, 0.96, 0.07, 0.46, C.stone, ink(0.025)) +
  line('M0.24,1.24 H0.76', C.stone, 0.04) +
  `<path d="M0.08,0.62 H0.92 L0.82,1.0 H0.18Z" fill="${C.stone}" ${ink(0.04)}/>` +
  `<ellipse cx="0.5" cy="0.64" rx="0.4" ry="0.08" fill="${C.deepBrown}" ${ink(0.025)}/>` +
  [0.28, 0.42, 0.56, 0.7].map((x, i) => dot(x, 0.64, 0.045, i % 2 ? C.lantern : C.stoneHot, 0.01)).join('') +
  line('M0.14,0.6 H0.86', C.tankRib, 0.025) +
  skewer(0.58) +
  rect(0.04, 0.6, 0.08, 0.06, C.stone, ink(0.015)) +
  rect(0.88, 0.6, 0.08, 0.06, C.stone, ink(0.015))

/** Một bóng đèn tròn treo dưới dây tại (x, y), có quầng sáng nhạt. */
const bulb = (x: number, y: number) =>
  `<circle cx="${f(x)}" cy="${f(y + 0.1)}" r="0.13" fill="${C.glow}" opacity="0.45"/>` +
  line(`M${f(x)},${f(y)} V${f(y + 0.04)}`, C.ink, 0.02) +
  rect(f(x - 0.03), f(y + 0.02), 0.06, 0.04, C.tankRib) +
  dot(x, y + 0.1, 0.06, C.mustard, 0.015)
/** Dây điện cong từ (x0, y0) qua điểm kéo (mx, my) tới (x1, y1), kèm `n` bóng đèn rải đều dọc dây. */
const sagWire = (x0: number, y0: number, mx: number, my: number, x1: number, y1: number, n: number) => {
  const at = (t: number) => [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * mx + t ** 2 * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * my + t ** 2 * y1]
  return (
    `<path d="M${x0},${y0} Q${f(mx)},${f(my)} ${x1},${y1}" stroke="${C.ink}" stroke-width="0.025" fill="none"/>` +
    Array.from({ length: n }, (_, i) => at((i + 1) / (n + 1))).map(([x, y]) => bulb(x, y)).join('')
  )
}

// giàn đèn dây: hai cột gỗ hai đầu, dây đèn bóng tròn võng xuống giữa, chân cột cắm trong chậu xi măng
const archPost = (x: number, top: number, bottom: number) =>
  rect(f(x - 0.05), top, 0.1, f(bottom - top - 0.2), C.woodDark, `rx="0.03" ${ink(0.03)}`) +
  `<path d="M${f(x - 0.16)},${f(bottom - 0.24)} H${f(x + 0.16)} L${f(x + 0.12)},${bottom} H${f(x - 0.12)}Z" fill="${C.stoneLight}" ${ink(0.03)}/>`
const lightArch =
  archPost(0.2, 0.2, 1.95) +
  archPost(2.8, 0.2, 1.95) +
  sagWire(0.2, 0.26, 1.5, 1.26, 2.8, 0.26, 6)

// giàn đèn dây dựng đứng: nhìn dọc theo dây, cột gần to ở dưới, cột xa nhỏ ở trên, bóng đèn chạy dọc giữa
const lightArchTurned =
  archPost(0.55, 0.1, 1.2) +
  sagWire(0.55, 0.16, 0.2, 0.9, 0.55, 1.5, 5) +
  archPost(0.55, 1.42, 3.0)

// xích đu: khung chữ A hai bên, mái vải sọc, ghế băng treo bằng xích có nệm bạc hà
const swingSeat = (x: number, w: number) =>
  rect(x, 0.66, w, 0.34, C.woodLight, `rx="0.06" ${ink(0.035)}`) +
  rect(f(x + 0.06), 0.72, f(w - 0.12), 0.22, C.mint, `rx="0.06" ${ink(0.02)}`) +
  rect(f(x - 0.04), 0.98, f(w + 0.08), 0.13, C.wood, `rx="0.04" ${ink(0.035)}`)
const gardenSwing =
  line('M0.08,1.95 L0.26,0.3 L0.44,1.95 M1.56,1.95 L1.74,0.3 L1.92,1.95', C.ink, 0.09) +
  line('M0.08,1.95 L0.26,0.3 L0.44,1.95 M1.56,1.95 L1.74,0.3 L1.92,1.95', C.tealDark, 0.05) +
  rect(0.16, 0.24, 1.68, 0.09, C.tealDark, `rx="0.03" ${ink(0.025)}`) +
  rect(0.1, 0.04, 1.8, 0.2, C.cream, `rx="0.05" ${ink(0.03)}`) +
  [0.18, 0.54, 0.9, 1.26, 1.62].map(x => rect(x, 0.06, 0.18, 0.16, C.lantern)).join('') +
  rect(0.1, 0.04, 1.8, 0.2, 'none', `rx="0.05" ${ink(0.03)}`) +
  line('M0.56,0.33 V0.7 M1.44,0.33 V0.7', C.tankRib, 0.03) +
  swingSeat(0.46, 1.08)

// xích đu dựng đứng: nhìn từ một đầu, khung chữ A, ghế nhìn nghiêng hình chữ L treo dưới thanh ngang, mái vải phía trên
const gardenSwingTurned =
  line('M0.08,2.4 L0.55,0.4 L1.02,2.4', C.ink, 0.09) +
  line('M0.08,2.4 L0.55,0.4 L1.02,2.4', C.tealDark, 0.05) +
  `<path d="M0.1,0.42 Q0.55,0.1 1.0,0.42Z" fill="${C.lantern}" ${ink(0.03)}/>` +
  line('M0.55,0.42 V1.3', C.tankRib, 0.03) +
  rect(0.3, 1.3, 0.5, 0.14, C.wood, `rx="0.04" ${ink(0.03)}`) +
  rect(0.3, 0.86, 0.12, 0.5, C.woodLight, `rx="0.04" ${ink(0.03)}`) +
  rect(0.42, 1.2, 0.36, 0.12, C.mint, `rx="0.05" ${ink(0.02)}`) +
  line('M0.3,1.72 H0.8', C.tealDark, 0.04)

// võng: hai cột gỗ, võng dù xanh có mắt lưới võng xuống giữa, dây buộc hai đầu
const hammockPost = (x: number) => rect(x, 0.2, 0.14, 1.36, C.woodDark, `rx="0.04" ${ink(0.035)}`) + dot(x + 0.07, 0.22, 0.06, C.wood, 0.02)
const hammock =
  hammockPost(0.06) +
  hammockPost(2.8) +
  line('M0.2,0.4 L0.62,0.62 M2.8,0.4 L2.38,0.62', C.sand, 0.03) +
  `<path d="M0.6,0.6 Q1.5,1.5 2.4,0.6 Q1.5,0.84 0.6,0.6Z" fill="${C.tealLight}" ${ink(0.035)}/>` +
  line('M0.9,0.74 Q1.5,1.3 2.1,0.74 M1.2,0.8 Q1.5,1.08 1.8,0.8', C.teal, 0.02) +
  line('M0.6,0.6 Q1.5,1.5 2.4,0.6', C.mustard, 0.03)

// võng dựng đứng: nhìn dọc theo võng, cột gần ở dưới, cột xa ở trên, thân võng thuôn chạy dọc giữa
const hammockTurned =
  rect(0.48, 0.1, 0.12, 0.72, C.woodDark, `rx="0.04" ${ink(0.03)}`) +
  line('M0.54,0.3 V0.6 M0.54,2.1 V2.4', C.sand, 0.03) +
  `<path d="M0.54,0.6 Q0.12,1.36 0.54,2.12 Q0.96,1.36 0.54,0.6Z" fill="${C.tealLight}" ${ink(0.035)}/>` +
  line('M0.54,0.74 V1.98 M0.36,1.1 Q0.54,1.36 0.36,1.7 M0.72,1.1 Q0.54,1.36 0.72,1.7', C.teal, 0.02) +
  rect(0.46, 1.72, 0.16, 1.24, C.woodDark, `rx="0.04" ${ink(0.035)}`) +
  dot(0.54, 1.74, 0.07, C.wood, 0.02)

// chậu chuối cảnh: chậu đất nung to, vài tàu lá chuối rộng xoè lên có gân giữa
const bananaLeaf = (x: number, y: number, angle: number, len: number, fill: string) =>
  `<g transform="rotate(${angle} ${x} ${y})"><path d="M${x},${y} Q${f(x - 0.2)},${f(y - len * 0.5)} ${x},${f(y - len)} Q${f(x + 0.2)},${f(y - len * 0.5)} ${x},${y}Z" fill="${fill}" ${ink(0.025)}/>` +
  `<path d="M${x},${y} V${f(y - len + 0.04)}" stroke="${C.leafLight}" stroke-width="0.02"/></g>`
const bananaPlant =
  line('M0.5,1.5 V1.0 M0.46,1.5 Q0.4,1.2 0.36,1.0 M0.54,1.5 Q0.62,1.2 0.66,1.0', C.leaf, 0.06) +
  bananaLeaf(0.44, 1.2, -52, 0.48, C.leaf) +
  bananaLeaf(0.56, 1.2, 54, 0.46, C.leaf) +
  bananaLeaf(0.4, 1.1, -28, 0.66, C.leaf) +
  bananaLeaf(0.6, 1.1, 28, 0.66, C.leafLight) +
  bananaLeaf(0.5, 1.0, -6, 0.92, C.leafLight) +
  `<path d="M0.16,1.46 H0.84 L0.74,2.14 H0.26Z" fill="${C.terracotta}" ${ink(0.04)}/>` +
  rect(0.12, 1.4, 0.76, 0.12, C.terracotta, `rx="0.04" ${ink(0.035)}`) +
  line('M0.22,1.7 H0.78', C.lanternDark, 0.025)

// ---------- Nhà hàng: bàn ghế ăn tầng thượng ----------

/** Bếp than tổ ong nhỏ: thân đất nung, vỉ nướng có thịt, than hồng, khói bốc lên; tâm đáy ở (cx, base). */
const grillPot = (cx: number, base: number, r: number) =>
  line(`M${f(cx - r * 0.3)},${f(base - r * 1.2)} q-0.06,-0.1 0,-0.18 t0,-0.18 M${f(cx + r * 0.3)},${f(base - r * 1.2)} q-0.06,-0.1 0,-0.18 t0,-0.18`, C.steamBlue, 0.035) +
  rect(f(cx - r), f(base - r * 0.9), f(r * 2), f(r * 0.9), C.clayLight, `rx="0.04" ${ink(0.03)}`) +
  `<ellipse cx="${cx}" cy="${f(base - r * 0.9)}" rx="${r}" ry="${f(r * 0.3)}" fill="${C.deepBrown}" ${ink(0.025)}/>` +
  [-0.5, 0, 0.5].map((d, i) => dot(cx + d * r, base - r * 0.9, 0.035, i % 2 ? C.stoneHot : C.lantern, 0.01)).join('') +
  line(`M${f(cx - r * 0.9)},${f(base - r * 0.95)} H${f(cx + r * 0.9)}`, C.tankRib, 0.02) +
  `<ellipse cx="${f(cx - r * 0.35)}" cy="${f(base - r * 1.0)}" rx="0.07" ry="0.035" fill="${C.terracotta}" ${ink(0.012)}/>` +
  `<ellipse cx="${f(cx + r * 0.35)}" cy="${f(base - r * 1.0)}" rx="0.07" ry="0.035" fill="${C.clay}" ${ink(0.012)}/>`
/** Đĩa rau xà lách nhìn ngang, tâm ở (cx, cy). */
const greens = (cx: number, cy: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="0.18" ry="0.05" fill="${C.cream}" ${ink(0.02)}/>` +
  `<path d="M${f(cx - 0.12)},${f(cy - 0.02)} q0.06,-0.14 0.12,-0.04 q0.06,-0.12 0.12,0.04Z" fill="${C.leafLight}" ${ink(0.012)}/>`

// bàn nướng than: bàn gỗ như bàn ăn, giữa đặt bếp than có vỉ thịt đang nướng, hai bên là đĩa rau
const grillTable =
  rect(0.12, 0.94, 0.12, 0.6, C.woodDark, `rx="0.03" ${ink(0.035)}`) +
  rect(1.76, 0.94, 0.12, 0.6, C.woodDark, `rx="0.03" ${ink(0.035)}`) +
  rect(0.05, 0.6, 1.9, 0.4, C.wood, `rx="0.1" ${ink()}`) +
  line('M0.17,0.72 H1.83', C.woodLight, 0.045) +
  rect(0.05, 0.92, 1.9, 0.12, C.woodDark, `rx="0.05" ${ink(0.035)}`) +
  grillPot(1.0, 0.76, 0.26) +
  greens(0.4, 0.72) +
  greens(1.6, 0.72)

// bàn nướng than dựng đứng: mặt bàn chạy dọc lên, bếp than ở giữa, đĩa rau hai đầu, chân ở đầu gần
const grillTableTurned =
  rect(0.13, 2.04, 0.13, 0.42, C.woodDark, `rx="0.03" ${ink(0.035)}`) +
  rect(0.76, 2.04, 0.13, 0.42, C.woodDark, `rx="0.03" ${ink(0.035)}`) +
  rect(0.12, 0.5, 0.78, 1.7, C.wood, `rx="0.1" ${ink()}`) +
  line('M0.24,0.62 V2.08', C.woodLight, 0.045) +
  rect(0.05, 2.06, 0.92, 0.2, C.woodDark, `rx="0.06" ${ink(0.04)}`) +
  greens(0.5, 0.78) +
  grillPot(0.51, 1.5, 0.24) +
  greens(0.5, 1.86)

// bàn bar cao: mặt tròn nhỏ trên một trụ inox cao, đế tròn, trên bàn có ly trà tắc có ống hút
const barTable =
  `<ellipse cx="0.5" cy="1.52" rx="0.3" ry="0.07" fill="${C.tankRib}" ${ink(0.03)}/>` +
  rect(0.46, 0.5, 0.08, 1.02, C.silver, ink(0.025)) +
  line('M0.3,1.18 H0.7', C.tankRib, 0.035) +
  `<ellipse cx="0.5" cy="0.52" rx="0.44" ry="0.12" fill="${C.woodDark}" ${ink(0.035)}/>` +
  `<ellipse cx="0.5" cy="0.48" rx="0.44" ry="0.12" fill="${C.woodLight}" ${ink(0.035)}/>` +
  `<path d="M0.58,0.2 H0.74 L0.72,0.46 H0.6Z" fill="${C.glass}" ${ink(0.018)}/>` +
  rect(0.61, 0.3, 0.1, 0.14, C.mustard, `opacity="0.85"`) +
  line('M0.68,0.2 L0.72,0.08', C.lantern, 0.025) +
  dot(0.62, 0.26, 0.03, C.leafLight, 0.008)

// bàn thấp ngồi bệt: tấm gỗ dày chân ngắn, trên có ấm trà, hai chén và đĩa hạt hướng dương
const seeds = (cx: number, cy: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="0.16" ry="0.045" fill="${C.cream}" ${ink(0.02)}/>` +
  [-0.08, -0.02, 0.04, 0.1].map((d, i) => `<ellipse cx="${f(cx + d)}" cy="${f(cy - 0.03 - (i % 2) * 0.02)}" rx="0.03" ry="0.018" fill="${C.ink}"/>`).join('')
const smallPot = (cx: number, base: number) =>
  `<path d="M${f(cx - 0.12)},${base} Q${f(cx - 0.16)},${f(base - 0.16)} ${cx},${f(base - 0.18)} Q${f(cx + 0.16)},${f(base - 0.16)} ${f(cx + 0.12)},${base}Z" fill="${C.cobalt}" ${ink(0.02)}/>` +
  line(`M${f(cx + 0.13)},${f(base - 0.1)} l0.08,-0.06`, C.cobalt, 0.03) +
  dot(cx, base - 0.2, 0.025, C.cobalt, 0.01)
const teaCup = (cx: number, base: number) => rect(f(cx - 0.05), f(base - 0.08), 0.1, 0.08, C.cream, `rx="0.02" ${ink(0.015)}`)
const lowTable =
  rect(0.16, 1.02, 0.12, 0.26, C.woodDark, ink(0.03)) +
  rect(1.72, 1.02, 0.12, 0.26, C.woodDark, ink(0.03)) +
  rect(0.04, 0.74, 1.92, 0.3, C.woodLight, `rx="0.08" ${ink()}`) +
  rect(0.06, 0.96, 1.88, 0.1, C.wood, `rx="0.04" ${ink(0.03)}`) +
  line('M0.2,0.84 H1.8', C.plank, 0.03) +
  smallPot(0.55, 0.82) +
  teaCup(0.86, 0.82) +
  teaCup(1.04, 0.82) +
  seeds(1.5, 0.8)

// bàn thấp ngồi bệt dựng đứng: tấm gỗ chạy dọc lên, ấm trà ở đầu xa, chén và đĩa hạt dọc mặt bàn
const lowTableTurned =
  rect(0.14, 2.0, 0.12, 0.26, C.woodDark, ink(0.03)) +
  rect(0.76, 2.0, 0.12, 0.26, C.woodDark, ink(0.03)) +
  rect(0.08, 0.4, 0.86, 1.66, C.woodLight, `rx="0.08" ${ink()}`) +
  line('M0.22,0.52 V1.9', C.plank, 0.03) +
  rect(0.08, 1.94, 0.86, 0.14, C.wood, `rx="0.04" ${ink(0.03)}`) +
  smallPot(0.5, 0.82) +
  teaCup(0.4, 1.12) +
  teaCup(0.62, 1.12) +
  seeds(0.5, 1.6)

// ghế bar cao: mặt ngồi tròn bọc nệm đỏ, ba chân inox cao có vòng gác chân
const barStool =
  line('M0.3,0.72 L0.18,1.5 M0.7,0.72 L0.82,1.5 M0.5,0.74 V1.52', C.ink, 0.07) +
  line('M0.3,0.72 L0.18,1.5 M0.7,0.72 L0.82,1.5 M0.5,0.74 V1.52', C.silver, 0.035) +
  `<ellipse cx="0.5" cy="1.14" rx="0.26" ry="0.06" fill="none" stroke="${C.ink}" stroke-width="0.06"/>` +
  `<ellipse cx="0.5" cy="1.14" rx="0.26" ry="0.06" fill="none" stroke="${C.silver}" stroke-width="0.03"/>` +
  rect(0.16, 0.6, 0.68, 0.14, C.lantern, `rx="0.07" ${ink(0.035)}`) +
  `<ellipse cx="0.5" cy="0.6" rx="0.34" ry="0.08" fill="${C.lantern}" ${ink(0.035)}/>` +
  line('M0.3,0.58 Q0.5,0.54 0.7,0.58', C.lanternDark, 0.02)

// ghế xếp inox: khung inox, lưng và mặt ngồi bọc nệm đỏ, hai chân bắt chéo phía dưới
const foldingChair =
  line('M0.26,0.12 V0.74 M0.74,0.12 V0.74', C.ink, 0.07) +
  line('M0.26,0.12 V0.74 M0.74,0.12 V0.74', C.silver, 0.035) +
  rect(0.22, 0.14, 0.56, 0.3, C.lantern, `rx="0.06" ${ink(0.035)}`) +
  line('M0.22,0.84 L0.78,1.36 M0.78,0.84 L0.22,1.36', C.ink, 0.07) +
  line('M0.22,0.84 L0.78,1.36 M0.78,0.84 L0.22,1.36', C.silver, 0.035) +
  rect(0.14, 0.66, 0.72, 0.2, C.lantern, `rx="0.06" ${ink(0.04)}`) +
  line('M0.2,0.7 H0.8', C.lanternDark, 0.02)

// đệm ngồi bệt: đệm vuông dày màu vàng nghệ có viền đỏ và nút bấm giữa, đặt thấp sát sàn
const floorCushion =
  rect(0.08, 0.62, 0.84, 0.38, C.mustard, `rx="0.12" ${ink(0.04)}`) +
  rect(0.14, 0.66, 0.72, 0.18, C.gold, `rx="0.08"`) +
  line('M0.14,0.92 H0.86', C.lantern, 0.04) +
  dot(0.5, 0.76, 0.04, C.lanternDark, 0.012) +
  line('M0.3,0.72 L0.46,0.76 M0.7,0.72 L0.54,0.76', C.mustardDark, 0.015)

// ---------- Nhà hàng: đồ trang trí tầng 2 ----------

/** Chồng đĩa sứ trắng viền xanh nhìn nghiêng, đáy ở (cx, base). */
const dishStack = (cx: number, base: number, n: number) =>
  Array.from({ length: n }, (_, i) => `<ellipse cx="${cx}" cy="${f(base - i * 0.05)}" rx="0.14" ry="0.035" fill="${C.cream}" stroke="${C.cobalt}" stroke-width="0.015"/>`).join('')
/** Chiếc bát úp, tâm đáy ở (cx, base). */
const bowlUp = (cx: number, base: number) =>
  `<path d="M${f(cx - 0.11)},${base} Q${f(cx - 0.11)},${f(base - 0.12)} ${cx},${f(base - 0.12)} Q${f(cx + 0.11)},${f(base - 0.12)} ${f(cx + 0.11)},${base}Z" fill="${C.cream}" ${ink(0.015)}/>` +
  line(`M${f(cx - 0.08)},${f(base - 0.05)} H${f(cx + 0.08)}`, C.cobalt, 0.015)

// tủ chén: tủ gỗ cao hai cánh kính, trong bày bát đĩa sứ, dưới là hai ngăn kéo, nóc có gờ
const dishCabinet =
  rect(0.1, 0.1, 1.8, 0.12, C.woodDark, `rx="0.04" ${ink(0.035)}`) +
  rect(0.14, 0.2, 1.72, 1.66, C.wood, `rx="0.05" ${ink()}`) +
  rect(0.24, 0.3, 0.72, 0.86, C.glass, ink(FINE)) +
  rect(1.04, 0.3, 0.72, 0.86, C.glass, ink(FINE)) +
  line('M0.26,0.74 H0.94 M1.06,0.74 H1.74', C.woodLight, 0.035) +
  dishStack(0.45, 0.68, 4) + bowlUp(0.76, 0.7) + bowlUp(1.26, 0.7) + dishStack(1.56, 0.68, 4) +
  bowlUp(0.42, 1.1) + bowlUp(0.66, 1.1) + dishStack(1.3, 1.08, 3) + bowlUp(1.6, 1.1) +
  line('M0.36,0.36 L0.5,0.5 M1.16,0.36 L1.3,0.5', '#FFFFFF', 0.03) +
  dot(0.9, 0.74, 0.03, C.mustard, 0.01) + dot(1.1, 0.74, 0.03, C.mustard, 0.01) +
  rect(0.24, 1.26, 0.72, 0.5, C.woodLight, `rx="0.04" ${ink(0.03)}`) +
  rect(1.04, 1.26, 0.72, 0.5, C.woodLight, `rx="0.04" ${ink(0.03)}`) +
  dot(0.6, 1.5, 0.035, C.mustard, 0.012) + dot(1.4, 1.5, 0.035, C.mustard, 0.012) +
  rect(0.18, 1.84, 0.12, 0.1, C.woodDark, ink(0.02)) +
  rect(1.7, 1.84, 0.12, 0.1, C.woodDark, ink(0.02))

// tủ chén dựng đứng: nhìn từ một đầu tủ, mặt bên gỗ chạy dọc lên, cánh kính ở cạnh phải, ngăn kéo ở đầu gần
const dishCabinetTurned =
  rect(0.82, 0.2, 0.2, 2.5, C.glass, `rx="0.04" ${ink(FINE)}`) +
  [0.5, 1.0, 1.5].map(y => line(`M0.86,${y} H1.0`, C.cream, 0.04)).join('') +
  rect(0.08, 0.1, 0.78, 2.6, C.wood, `rx="0.05" ${ink()}`) +
  line('M0.2,0.2 V2.0', C.woodLight, 0.04) +
  rect(0.06, 0.04, 1.0, 0.12, C.woodDark, `rx="0.04" ${ink(0.035)}`) +
  rect(0.14, 2.06, 0.66, 0.54, C.woodLight, `rx="0.04" ${ink(0.03)}`) +
  dot(0.47, 2.33, 0.035, C.mustard, 0.012) +
  rect(0.12, 2.7, 0.12, 0.1, C.woodDark, ink(0.02)) +
  rect(0.7, 2.7, 0.12, 0.1, C.woodDark, ink(0.02))

// kệ rượu ngâm: kệ gỗ hai tầng, trên mỗi tầng một bình thuỷ tinh rượu ngâm vàng hổ phách có trái cây, rễ cây trong bình
const wineJar = (cx: number, base: number, fill: string, bits: string) =>
  rect(f(cx - 0.17), f(base - 0.4), 0.34, 0.4, C.glass, `rx="0.08" ${ink(0.025)}`) +
  rect(f(cx - 0.14), f(base - 0.3), 0.28, 0.27, fill, `rx="0.06" opacity="0.85"`) +
  bits +
  rect(f(cx - 0.12), f(base - 0.48), 0.24, 0.09, C.woodDark, `rx="0.03" ${ink(0.02)}`) +
  line(`M${f(cx - 0.12)},${f(base - 0.36)} L${f(cx - 0.06)},${f(base - 0.08)}`, '#FFFFFF', 0.02)
const wineJarShelf =
  rect(0.08, 0.14, 0.08, 1.3, C.woodDark, ink(0.025)) +
  rect(0.84, 0.14, 0.08, 1.3, C.woodDark, ink(0.025)) +
  wineJar(0.5, 0.66, C.mustardDark, dot(0.42, 0.52, 0.04, C.lantern, 0.01) + dot(0.56, 0.56, 0.04, C.lantern, 0.01) + dot(0.48, 0.42, 0.035, C.lantern, 0.01)) +
  rect(0.04, 0.66, 0.92, 0.08, C.wood, `rx="0.03" ${ink(0.03)}`) +
  wineJar(0.5, 1.3, C.mustard, line('M0.44,1.06 Q0.5,1.16 0.46,1.26 M0.54,1.04 Q0.6,1.14 0.56,1.24', C.clay, 0.03)) +
  rect(0.04, 1.3, 0.92, 0.08, C.wood, `rx="0.03" ${ink(0.03)}`)

// dàn karaoke: tivi màn hình hiện lời bài hát trên tủ thấp, hai loa thùng đứng hai bên, micro đặt trên tủ
const speaker = (x: number) =>
  rect(x, 0.62, 0.36, 0.8, C.deepBrown, `rx="0.04" ${ink(0.035)}`) +
  dot(x + 0.18, 0.82, 0.09, C.stone, 0.02) + dot(x + 0.18, 0.82, 0.035, C.stoneLight, 0.01) +
  dot(x + 0.18, 1.14, 0.13, C.stone, 0.02) + dot(x + 0.18, 1.14, 0.05, C.stoneLight, 0.01)
const karaokeScreen = (x: number, y: number, w: number, h: number) =>
  rect(x, y, w, h, C.deepBrown, `rx="0.04" ${ink(0.035)}`) +
  rect(f(x + 0.05), f(y + 0.05), f(w - 0.1), f(h - 0.1), C.cobalt) +
  `<path d="M${f(x + 0.05)},${f(y + h * 0.6)} Q${f(x + w * 0.4)},${f(y + h * 0.35)} ${f(x + w - 0.05)},${f(y + h * 0.55)} V${f(y + h - 0.05)} H${f(x + 0.05)}Z" fill="${C.tealLight}"/>` +
  line(`M${f(x + w * 0.2)},${f(y + h * 0.72)} H${f(x + w * 0.62)}`, C.gold, 0.03) +
  line(`M${f(x + w * 0.62)},${f(y + h * 0.72)} H${f(x + w * 0.8)}`, C.cream, 0.03) +
  line(`M${f(x + w * 0.28)},${f(y + h * 0.84)} H${f(x + w * 0.72)}`, C.cream, 0.025)
const karaoke =
  speaker(0.04) +
  speaker(1.6) +
  karaokeScreen(0.46, 0.16, 1.08, 0.66) +
  rect(0.94, 0.82, 0.12, 0.08, C.deepBrown, ink(0.02)) +
  rect(0.44, 0.9, 1.12, 0.52, C.wood, `rx="0.04" ${ink(0.04)}`) +
  line('M1.0,0.94 V1.38', C.woodDark, 0.025) +
  rect(0.56, 1.0, 0.36, 0.1, C.deepBrown, `rx="0.02"`) + dot(0.62, 1.05, 0.02, C.leafLight, 0.006) +
  `<g transform="rotate(-70 1.3 0.86)">${rect(1.18, 0.83, 0.26, 0.06, C.tankRib, `rx="0.03" ${ink(0.015)}`)}${dot(1.46, 0.86, 0.05, C.stone, 0.012)}</g>` +
  rect(0.5, 1.4, 0.1, 0.06, C.woodDark) + rect(1.4, 1.4, 0.1, 0.06, C.woodDark)

// dàn karaoke dựng đứng: nhìn từ một đầu, loa gần ở dưới, tủ chạy dọc lên, tivi nhìn nghiêng mỏng đứng trên tủ, loa xa ở trên
const karaokeTurned =
  rect(0.3, 0.06, 0.4, 0.5, C.deepBrown, `rx="0.04" ${ink(0.03)}`) + dot(0.5, 0.3, 0.1, C.stone, 0.02) +
  rect(0.14, 0.56, 0.72, 1.5, C.wood, `rx="0.04" ${ink(0.04)}`) +
  rect(0.44, 0.66, 0.12, 1.02, C.deepBrown, `rx="0.03" ${ink(0.025)}`) +
  rect(0.4, 1.1, 0.2, 0.1, C.deepBrown, ink(0.015)) +
  rect(0.24, 1.72, 0.52, 0.8, C.deepBrown, `rx="0.04" ${ink(0.035)}`) +
  dot(0.5, 1.92, 0.09, C.stone, 0.02) + dot(0.5, 2.24, 0.15, C.stone, 0.02) + dot(0.5, 2.24, 0.05, C.stoneLight, 0.01)

// quạt treo tường: giá gắn tường, lồng quạt tròn màu kem có ba cánh xanh và núm cam, dây kéo thả xuống
const wallFan =
  rect(0.42, 0.98, 0.16, 0.24, C.cream, `rx="0.04" ${ink(0.03)}`) +
  line('M0.62,1.06 V1.4', C.ink, 0.015) + dot(0.62, 1.42, 0.03, C.lantern, 0.01) +
  dot(0.5, 0.64, 0.36, C.cream, 0.04) +
  [0, 120, 240].map(a => `<ellipse cx="0.5" cy="0.47" rx="0.09" ry="0.15" transform="rotate(${a} 0.5 0.64)" fill="${C.mintTeal}" ${ink(0.02)}/>`).join('') +
  `<g fill="none" stroke="${C.tankRib}" stroke-width="0.018"><circle cx="0.5" cy="0.64" r="0.36"/><circle cx="0.5" cy="0.64" r="0.24"/><path d="M0.14,0.64 H0.86 M0.5,0.28 V1.0"/></g>` +
  dot(0.5, 0.64, 0.06, C.stoneHot, 0.02)

// tranh thư pháp: cuộn giấy kem nền đỏ hai trục gỗ, chữ "Phúc" viết nét bút lông nghiêng và con dấu đỏ ở góc
const calligraphy =
  hook(1, 0.14, 0.3) + line('M0.3,0.34 L1,0.16 L1.7,0.34', C.ink, 0.02) +
  rect(0.22, 0.3, 1.56, 1.14, C.lanternDark, `rx="0.03" ${ink(0.04)}`) +
  rect(0.32, 0.38, 1.36, 0.98, C.paper, ink(FINE)) +
  rect(0.16, 0.28, 1.68, 0.08, C.woodDark, `rx="0.04" ${ink(0.025)}`) +
  rect(0.16, 1.4, 1.68, 0.08, C.woodDark, `rx="0.04" ${ink(0.025)}`) +
  `<text x="0.98" y="1.04" font-family="'Snell Roundhand', 'Brush Script MT', cursive, serif" font-style="italic" font-weight="700" font-size="0.46" text-anchor="middle" fill="${C.ink}">Phúc</text>` +
  rect(1.48, 1.12, 0.12, 0.12, C.lantern, `rx="0.02"`)

// ảnh gia đình: ba khung ảnh treo lệch nhau, mỗi khung một tấm ảnh nền màu có người cười
const portrait = (x: number, y: number, w: number, h: number, frame: string, bg: string, people: number) =>
  rect(x, y, w, h, frame, `rx="0.02" ${ink(0.03)}`) +
  rect(f(x + 0.04), f(y + 0.04), f(w - 0.08), f(h - 0.08), bg) +
  Array.from({ length: people }, (_, i) => {
    const cx = x + (w * (i + 1)) / (people + 1)
    return dot(cx, y + h * 0.42, 0.045, C.cream, 0.01) + `<path d="M${f(cx - 0.06)},${f(y + h - 0.05)} Q${f(cx)},${f(y + h * 0.5)} ${f(cx + 0.06)},${f(y + h - 0.05)}Z" fill="${C.terracotta}"/>`
  }).join('')
const familyPhotos =
  hook(0.5, 0.24, 0.34) +
  portrait(0.18, 0.34, 0.64, 0.46, C.mustard, C.water, 3) +
  portrait(0.1, 0.9, 0.38, 0.5, C.woodDark, C.tealPale, 1) +
  portrait(0.54, 0.9, 0.38, 0.4, C.cream, C.goldPale, 2)

// chậu kim tiền: chậu sứ trắng viền vàng, những cọng thẳng mọc lá bầu dục xanh bóng xếp đôi hai bên
const zzStem = (x0: number, x1: number, top: number, n: number) => {
  const leaves = Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / (n + 1)
    const x = f(x0 + (x1 - x0) * t)
    const y = f(1.36 - (1.36 - top) * t)
    return [-1, 1].map(s => `<ellipse cx="${f(x + s * 0.07)}" cy="${y}" rx="0.07" ry="0.035" transform="rotate(${s * -30} ${f(x + s * 0.07)} ${y})" fill="${i % 2 ? C.leafLight : C.leaf}" ${ink(0.012)}/>`).join('')
  }).join('')
  return line(`M${x0},1.36 L${x1},${top}`, C.leaf, 0.03) + leaves
}
const moneyPlant =
  zzStem(0.42, 0.24, 0.3, 5) +
  zzStem(0.5, 0.52, 0.12, 6) +
  zzStem(0.58, 0.78, 0.36, 5) +
  `<path d="M0.2,1.34 H0.8 L0.72,1.86 Q0.5,1.94 0.28,1.86Z" fill="${C.cream}" ${ink(0.04)}/>` +
  rect(0.16, 1.3, 0.68, 0.1, C.cream, `rx="0.04" ${ink(0.035)}`) +
  line('M0.24,1.52 H0.76', C.gold, 0.035)

// đàn tranh: thân đàn gỗ dài cong nhẹ đặt trên giá chữ X, dây đàn chạy dọc với hàng nhạn chéo, đầu đàn chạm hoa văn
const danTranhBody = (len: number) => {
  const strings = Array.from({ length: 6 }, (_, i) => line(`M0.22,${f(0.62 + i * 0.035)} H${f(len - 0.2)}`, C.cream, 0.008)).join('')
  const bridges = Array.from({ length: 6 }, (_, i) => `<path d="M${f(0.6 + i * 0.18)},${f(0.64 + i * 0.035)} l0.04,-0.06 l0.04,0.06Z" fill="${C.cream}" ${ink(0.01)}/>`).join('')
  return (
    `<path d="M0.1,0.6 Q${f(len / 2)},0.5 ${f(len - 0.1)},0.6 L${f(len - 0.1)},0.88 Q${f(len / 2)},0.8 0.1,0.88Z" fill="${C.wood}" ${ink(0.04)}/>` +
    `<path d="M0.1,0.6 Q${f(len / 2)},0.5 ${f(len - 0.1)},0.6" stroke="${C.woodLight}" stroke-width="0.04" fill="none"/>` +
    strings + bridges +
    rect(0.06, 0.56, 0.18, 0.36, C.woodDark, `rx="0.04" ${ink(0.03)}`) + dot(0.15, 0.74, 0.04, C.mustard, 0.01) +
    rect(f(len - 0.22), 0.56, 0.16, 0.36, C.woodDark, `rx="0.04" ${ink(0.03)}`)
  )
}
const danTranh =
  line('M0.3,0.86 L0.62,1.4 M0.62,0.86 L0.3,1.4 M1.38,0.86 L1.7,1.4 M1.7,0.86 L1.38,1.4', C.ink, 0.07) +
  line('M0.3,0.86 L0.62,1.4 M0.62,0.86 L0.3,1.4 M1.38,0.86 L1.7,1.4 M1.7,0.86 L1.38,1.4', C.woodDark, 0.04) +
  danTranhBody(2)

// đàn tranh dựng đứng: nhìn từ đầu đàn, thân đàn chạy dọc lên, dây đàn dọc với nhạn ngang, giá chữ X ở đầu gần
const danTranhTurned =
  line('M0.2,1.9 L0.9,2.4 M0.9,1.9 L0.2,2.4', C.ink, 0.07) +
  line('M0.2,1.9 L0.9,2.4 M0.9,1.9 L0.2,2.4', C.woodDark, 0.04) +
  `<path d="M0.3,0.1 Q0.2,1.0 0.3,2.0 H0.8 Q0.9,1.0 0.8,0.1Z" fill="${C.wood}" ${ink(0.04)}/>` +
  Array.from({ length: 5 }, (_, i) => line(`M${f(0.38 + i * 0.085)},0.3 V1.82`, C.cream, 0.008)).join('') +
  Array.from({ length: 5 }, (_, i) => `<path d="M${f(0.34 + i * 0.085)},${f(0.6 + i * 0.2)} h0.08" stroke="${C.cream}" stroke-width="0.03"/>`).join('') +
  rect(0.26, 1.86, 0.58, 0.18, C.woodDark, `rx="0.04" ${ink(0.03)}`) + dot(0.55, 1.95, 0.04, C.mustard, 0.01) +
  rect(0.3, 0.06, 0.5, 0.14, C.woodDark, `rx="0.04" ${ink(0.03)}`)

/** Hình của từng món, đặt khoá theo kiểu `decor-` của furniture.ts; món xoay được có thêm hình `-turned`. */
export const MORE_DECOR: Record<string, { w: number; h: number; body: string }> = {
  'decor-velvetSofa': { w: 3, h: 1.35, body: velvetSofa },
  'decor-velvetSofa-turned': { w: 1.1, h: 3.35, body: velvetSofaTurned },
  'decor-rattanArmchair': { w: 1, h: 1.45, body: rattanArmchair },
  'decor-vanity': { w: 2, h: 1.45, body: vanity },
  'decor-vanity-turned': { w: 1.1, h: 2.3, body: vanityTurned },
  'decor-towelSteamer': { w: 1, h: 1.5, body: towelSteamer },
  'decor-aromaDiffuser': { w: 1, h: 1.6, body: aromaDiffuser },
  'decor-tileRug': { w: 2, h: 2, body: tileRug(2, 2) },
  'decor-tearCalendar': { w: 1, h: 2, body: tearCalendar },
  'decor-streetTable': { w: 1, h: 1.2, body: streetTable },
  'decor-roundTable': { w: 2, h: 2.2, body: roundTable },
  'decor-plasticStool': { w: 1, h: 1.05, body: plasticStool },
  'decor-bambooChair': { w: 1, h: 1.4, body: bambooChair },
  'decor-menuBoard': { w: 2, h: 2, body: menuBoard },
  'decor-drinkFridge': { w: 1, h: 2.05, body: drinkFridge },
  'decor-icedTeaStand': { w: 1, h: 1.5, body: icedTeaStand },
  'decor-pool': { w: 4, h: 4.2, body: pool },
  'decor-sunLounger': { w: 2, h: 1.2, body: sunLounger },
  'decor-sunLounger-turned': { w: 1.1, h: 2.3, body: sunLoungerTurned },
  'decor-charcoalGrill': { w: 1, h: 1.45, body: charcoalGrill },
  'decor-lightArch': { w: 3, h: 2, body: lightArch },
  'decor-lightArch-turned': { w: 1.1, h: 3, body: lightArchTurned },
  'decor-gardenSwing': { w: 2, h: 2, body: gardenSwing },
  'decor-gardenSwing-turned': { w: 1.1, h: 2.45, body: gardenSwingTurned },
  'decor-hammock': { w: 3, h: 1.6, body: hammock },
  'decor-hammock-turned': { w: 1.1, h: 3, body: hammockTurned },
  'decor-bananaPlant': { w: 1, h: 2.2, body: bananaPlant },
  'decor-grillTable': { w: 2, h: 1.6, body: grillTable },
  'decor-grillTable-turned': { w: 1.1, h: 2.5, body: grillTableTurned },
  'decor-barTable': { w: 1, h: 1.6, body: barTable },
  'decor-lowTable': { w: 2, h: 1.35, body: lowTable },
  'decor-lowTable-turned': { w: 1.1, h: 2.3, body: lowTableTurned },
  'decor-barStool': { w: 1, h: 1.6, body: barStool },
  'decor-foldingChair': { w: 1, h: 1.45, body: foldingChair },
  'decor-floorCushion': { w: 1, h: 1.05, body: floorCushion },
  'decor-dishCabinet': { w: 2, h: 1.95, body: dishCabinet },
  'decor-dishCabinet-turned': { w: 1.1, h: 2.82, body: dishCabinetTurned },
  'decor-wineJarShelf': { w: 1, h: 1.45, body: wineJarShelf },
  'decor-karaoke': { w: 2, h: 1.48, body: karaoke },
  'decor-karaoke-turned': { w: 1.1, h: 2.55, body: karaokeTurned },
  'decor-wallFan': { w: 1, h: 2, body: wallFan },
  'decor-calligraphy': { w: 2, h: 2, body: calligraphy },
  'decor-familyPhotos': { w: 1, h: 2, body: familyPhotos },
  'decor-moneyPlant': { w: 1, h: 1.95, body: moneyPlant },
  'decor-danTranh': { w: 2, h: 1.45, body: danTranh },
  'decor-danTranh-turned': { w: 1.1, h: 2.45, body: danTranhTurned },
}
