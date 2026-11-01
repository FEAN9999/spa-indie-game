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
}
