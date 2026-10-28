# Lô B: áo chủ tiệm (save v20) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The owner can wear 9 outfits: Áo bà ba plus 7 unlocked by badge count and 1 by winning Spa của năm. Players pick them in a wardrobe (Tủ áo) and get a "new outfit" card (Áo mới) when one unlocks. Save version 20.

**Architecture:**
- A pure `src/sim/outfits.ts` works out which outfits are unlocked from the badge count and the number of Spa của năm wins. Unlocked outfits are never stored; the sim saves only the worn outfit and the ones already announced.
- The art is SVG chibi parts in `src/art/outfits.ts`, registered with the existing chibi textures. `CharacterView` draws the owner in an outfit when `CharacterColors.outfit` is set.
- Two overlay scenes: `WardrobeScene` (opened from the Thành tựu tab and the owner card) and `NewOutfitScene` (the Áo mới card, which pauses the shop like the inspection card).

**Tech Stack:** Phaser 4, TypeScript, Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-28-dot-3-hang-ao-vang-design.md`. Lô B covers §7.5, §8.2, §8.4 (v20) and §9.

**Art reference:** sketch `C:\Users\phatlee\AppData\Local\Temp\claude\D--Project-spa-indie-game\9ad07023-61da-40ae-b124-964377a3b4ba\scratchpad\sketch\`:
- `outfits.js` holds all 8 outfits from the front, in chibi units on the game's own part origins.
- `template-hang.html` has `drawWardrobe` (around line 682) and `newOutfitCard` (around 722).
- `test-outfits.png` shows them drawn.

## Global Constraints

- **The 9 outfits, in this order, and when each unlocks** (`OUTFIT_NEED` in config is 2, 4, 6, 9, 12, 16, 20):
  - `baba` Áo bà ba: from the start.
  - `uniform` Đồng phục spa: 2 badges.
  - `khanran` Bà ba khăn rằn: 4.
  - `teal` Áo dài xanh ngọc: 6.
  - `lotus` Áo dài hồng sen: 9.
  - `tile` Áo dài gạch bông: 12.
  - `mai` Áo dài hoa mai: 16.
  - `gam` Áo dài gấm: 20.
  - `year` Áo dài Spa của năm: won Spa của năm at least once (`rank.wins > 0`).
- **Badge count** is the number of keys in `sim.badges`, which includes day-0 "found" badges.
- **Never take anything away.** Unlocked outfits are recomputed on every load and never stored. Only an unlocked outfit can be worn. Wearing costs nothing.
- **Only the owner wears outfits.** Staff, customers and visitors are drawn as today.
- **Áo bà ba** is drawn exactly as today, in the shirt colour picked on the owner card. That colour has no effect on any other outfit.
- **Áo dài** have long sleeves and white trousers. Nón lá, khăn vấn and the flower crown sit on the hair.
- **Announcements:**
  - New outfits are announced only from day 8 (`questsOpen()`), with one Áo mới card per batch showing the highest new outfit.
  - The card waits until the shop is free and any badge card has finished.
  - The card has buttons, so the shop pauses while it is open.
  - The card plays `levelUp`.
- **Save v20:**
  - Adds `ownerOutfit` (default `'baba'`) and `outfitsSeen` (default `['baba']`).
  - An unknown or locked `ownerOutfit` becomes `'baba'`. Unknown ids are dropped from `outfitsSeen`, and `'baba'` is always in it.
- **No randomness:** the new code draws nothing random, and `same-draws.test.ts` stays unchanged.
- **Text** never overflows or overlaps at iPhone width.
- **Copy, verbatim from the spec and sketch:**
  - "Tủ áo"
  - "Có {badges}/20 huy hiệu · mở {open}/9 bộ"
  - "Đang mặc"
  - "Bấm Mặc bộ này để thay"
  - "Cần {need} huy hiệu · còn {left} nữa"
  - "Chỉ có khi đoạt Spa của năm"
  - tile corner "Cần {need}" or "Spa của năm"
  - buttons "Xong" / "Mặc bộ này"
  - toast "Chủ tiệm mặc {name}"
  - card head "Áo mới · đủ {need} huy hiệu" or "Áo mới · quà Spa của năm"
  - "Mặc thử ngay, hay đổi sau ở Tủ áo trong thẻ Thành tựu."
  - "và {n} bộ khác trong Tủ áo"
  - buttons "Để sau" / "Mặc thử"
  - year card first win: "Lần đầu nên có thêm cúp vàng (vào Xây dựng) và áo dài Spa của năm."

## Plan Calls (mine, at planning)

- **Announced by pull, not by event.** Spec §8.2 describes an `outfitUnlocked` event emitted from the sim. Instead, `sim.newOutfits()` returns the unlocked outfits not yet in `outfitsSeen` (empty before day 8). The view shows the card when the shop is free, and calls `sim.markOutfitsSeen(ids)` when the card closes.
  - The player sees the same thing, with the same timing: after a badge card, and the morning after a Spa của năm win.
  - A reload while the card is open shows the card again instead of losing it.
  - Old shops get their card on load with no extra code.
- **Wardrobe placement.**
  - In the Thành tựu tab, the wardrobe button sits on the right of the header row (`DAY_HEAD_Y` 545) as "Tủ áo · {open}/9 bộ", so the badge grid does not move.
  - On the owner card, the "Tủ áo" button appears in `edit` mode only, beside the preview.
- **Wearing takes effect at once,** including from the owner card. The owner card's Hủy does not undo it.
- **The floor button's owner face** (a skin circle with a hair cap) does not change with outfits.

## Review Focus

1. **Reload while the Áo mới card is open.** The card shows again, `outfitsSeen` is unchanged until it closes, and nothing is worn twice or lost. Covered by T1's sim test; checked in the T6 browser pass.
2. **An old shop with 20 badges and a win, loaded on day 5, then on day 8.**
   - Day 5: no card.
   - Day 8: one card showing Áo dài Spa của năm with "và 7 bộ khác trong Tủ áo".
   - Covered by a T1 test and the T6 browser pass.
3. **Damaged or hostile save data.** `ownerOutfit` locked, unknown or not a string becomes `'baba'`. `outfitsSeen` that is not an array, or holds junk, becomes the valid ids plus `'baba'`. Covered by a T1 test.
4. **The owner in an áo dài with a hat,** facing down, side and up, walking, going up and down stairs, and changing floors. Nothing detaches, flips wrong or hides. Checked in the T6 browser pass.
5. **The year card's longest case still fits:** place 1, first win, with the new áo dài sentence, the rivals line and the score line. Covered by T5's text test and checked in the T6 browser pass.

---

### Task 1: Outfit rules, sim state and save v20

**Files:**
- Create: `src/sim/outfits.ts`, `tests/sim/outfits.test.ts`, `tests/fixtures/save-v19.json`
- Modify: `src/config.ts`, `src/sim/spa.ts`, `src/sim/save.ts`, `tests/sim/save.test.ts`

**Interfaces:**
- Produces from `src/sim/outfits.ts`:
  - `OUTFIT_IDS = ['baba','uniform','khanran','teal','lotus','tile','mai','gam','year'] as const`
  - `type OutfitId`
  - `outfitNeed(id: OutfitId): number | 'year'`, where `baba` is 0
  - `unlockedOutfits(badges: number, wins: number): OutfitId[]`, in `OUTFIT_IDS` order
  - `isOutfitId(x: unknown): x is OutfitId`
- Produces on `SpaSim`:
  - `ownerOutfit: OutfitId = 'baba'`
  - `outfitsSeen: OutfitId[] = ['baba']`
  - `unlockedOutfits(): OutfitId[]`
  - `wearOutfit(id: OutfitId): boolean`, which refuses a locked outfit
  - `newOutfits(): OutfitId[]`, which is `[]` while `!questsOpen()`
  - `markOutfitsSeen(ids: OutfitId[]): void`
- Produces in config: `OUTFIT_NEED: [2, 4, 6, 9, 12, 16, 20]`.

- [ ] **Step 1: Freeze the v19 fixture before anything changes.** With the current code (v19), write `tests/fixtures/save-v19.json`: a day-29 shop like `save-v18.json`, at 2 stars, with a non-null `rank.last`, and with 6 badges. Generate it from the sim the same way the earlier fixtures were made. It is never edited afterwards.
- [ ] **Step 2: Write the failing rule tests** in `tests/sim/outfits.test.ts`:
  - `unlockedOutfits(0, 0)` → `['baba']`
  - `(1, 0)` → `['baba']`
  - `(2, 0)` → `['baba','uniform']`
  - `(9, 0)` → through `'lotus'`
  - `(20, 0)` → all but `'year'`
  - `(0, 1)` → `['baba','year']`
  - `(25, 3)` → all 9
  - `outfitNeed('gam')` → 20
  - `outfitNeed('year')` → `'year'`
  - `isOutfitId('teal')` is true; `isOutfitId('cape')` and `isOutfitId(3)` are false
- [ ] **Step 3: Write the failing sim tests** in the same file:
  - **Wearing:**
    - `wearOutfit('teal')` with 5 badges returns false and leaves `'baba'`.
    - With 6 badges it returns true.
  - **Announcing:**
    - `newOutfits()` on day 5 with 9 badges is `[]`.
    - On day 8 it is `['uniform','khanran','teal','lotus']`.
    - After `markOutfitsSeen` of those, it is `[]`.
  - **Reloads:**
    - `toSave`/`fromSave` keeps `ownerOutfit` and `outfitsSeen`.
    - A shop saved with the card's outfits unseen still reports them after reload (Review Focus 1).
  - **Old shop:** 20 badges and `rank.wins = 1`, loaded on day 5, gives `[]`. Advanced to day 8, it gives 8 ids, the last being `'year'` (Review Focus 2).
- [ ] **Step 4: Implement.** In `src/sim/outfits.ts`, read the numbers from `OUTFIT_NEED`; no strings. In `SpaSim`:
  - the badge count is `Object.keys(this.badges).length`;
  - wins come from `this.rank.wins`;
  - `markOutfitsSeen` adds only unknown ids, in `OUTFIT_IDS` order.
- [ ] **Step 5: Implement save v20.**
  - `SAVE_VERSION = 20`, and `parseVersioned` also accepts 19.
  - `SaveData` gains `ownerOutfit` and `outfitsSeen`. `repairOutfits(x, badges, wins)` runs after the badges and rank repairs.
  - Saves before v20 get `'baba'` / `['baba']`.
  - A locked or unknown worn outfit becomes `'baba'`. `outfitsSeen` keeps valid ids, always includes `'baba'`, and is ordered by `OUTFIT_IDS`.
- [ ] **Step 6: Write the save tests** in `tests/sim/save.test.ts`:
  - `save-v19.json` parses to `'baba'` / `['baba']` with its rank intact.
  - The repair cases from Review Focus 3:
    - `ownerOutfit: 'gam'` with 3 badges;
    - `'cape'`;
    - `42`;
    - `outfitsSeen: 'x'`;
    - `outfitsSeen: ['teal', 'cape', 7]`.
  - A v20 round-trip.
- [ ] **Step 7:** `npx tsc --noEmit` and `npx vitest run` are green; `same-draws.test.ts` is unchanged.
- [ ] **Step 8: Commit:** "Work out the owner's outfits from badges and Spa của năm wins, and save the one worn (save version 20)"

### Task 2: Outfit art

**Files:**
- Create: `src/art/outfits.ts`, `tests/art/outfits.test.ts`
- Modify: `src/art/chibi.ts` (export `Part`; spread `OUTFIT_PARTS` into `parts` so `PART_ANCHORS` and `chibiTextures()` include them)

**Interfaces:**
- Consumes `OutfitId` from Task 1.
- Produces from `src/art/outfits.ts`:
  - `OUTFIT_PARTS: Record<string, Part>`, with keys:
    - `outfit-<id>-down|side|up`: the torso, from shoulders to the ankle panel, including the hip and trouser top;
    - `sleeve-<id>`: one sleeve on the arm's own origin, viewBox `[-3.2, -1.2, 6.4, 12.4]`;
    - `outfitHat-<id>-down|side|up`: for `lotus` (nón lá), `mai` and `gam` (khăn vấn), and `year` (flower crown).
  - `OUTFIT_PANTS: Record<Exclude<OutfitId,'baba'>, number>`: the trouser colours, cream `#FBF7EE` for every áo dài.
  - `OUTFIT_HAS_HAT: readonly OutfitId[]`.
  - There are no keys for `baba`.

- [ ] **Step 1: Write the failing test.**
  - Every non-`baba` id has `outfit-<id>-down`, `-side` and `-up`, plus `sleeve-<id>`, all in `PART_ANCHORS` and in `chibiTextures()`.
  - Exactly the four hat ids have three hat keys each.
  - None of the new keys matches chibi's `TINTED` pattern, so they are drawn untinted.
  - Every texture string is an SVG document.
- [ ] **Step 2: Draw the front views.** The `-down` views follow `outfits.js` exactly: shapes, colours, patterns, flowers, the sash and medal. Patterns are drawn per texture, so ids may repeat between textures.
- [ ] **Step 3: Draw the side and back views** in the same line weight and palette:
  - **Side (`-side`):** the outfit in profile, without front-only details (the side opening and buttons). The áo dài panel is seen edge-on, narrower.
  - **Back (`-up`):** the plain cloth with the collar's back. No front panel details, sash or medal.
  - **Hats:** each hat has a matching side and back view.
- [ ] **Step 4:** Tests green. Then render every outfit three ways into a scratch image and compare it with the sketch's `test-outfits.png`. Use `scratchpad/sketch/dump-chibi.mjs` and `test-build.mjs` as the model. Look at the result.
- [ ] **Step 5: Commit:** "Draw the owner's eight new outfits from the front, the side and the back"

### Task 3: The owner wears an outfit

**Files:**
- Modify:
  - `src/art/palette.ts`: `CharacterColors.outfit?: OutfitId`; `ownerColors(look, outfit?)`.
  - `src/view/CharacterView.ts`.
  - `src/scenes/SpaScene.ts`: a `rebuildOwner()` used by the profile save and by wearing.
  - `src/scenes/OwnerScene.ts`: the preview wears the current outfit.

**Interfaces:**
- Consumes `OUTFIT_PARTS` keys, `OUTFIT_PANTS` and `OUTFIT_HAS_HAT` from Task 2, and `sim.ownerOutfit` from Task 1.
- Produces `ownerColors(look: Look, outfit: OutfitId = 'baba'): CharacterColors`. Every owner `CharacterView` is built with `ownerColors(sim.ownerLook, sim.ownerOutfit)`.

- [ ] **Step 1:** With `outfit` unset or `'baba'`, `CharacterView` is unchanged: same children, same tints.
- [ ] **Step 2:** With another outfit:
  - The body and its outline are replaced by `outfit-<id>-<dir>`. `dir` is `down`, `side` (flipped for left) or `up`. The body stays hidden through every `setPose` and `setFacing`.
  - A `sleeve-<id>` image follows each arm's position, rotation, flip and visibility. In side view only the near arm's sleeve shows.
  - The legs are tinted `OUTFIT_PANTS[id]`.
  - Hat outfits wear `outfitHat-<id>-<dir>` on the hair layer, above the hair.
  - The stand breath and the walk bob apply as they do to the body.
- [ ] **Step 3:** `SpaScene` builds the owner with the outfit at create and in `rebuildOwner()`. `OwnerScene`'s preview wears `sim.ownerOutfit`.
- [ ] **Step 4:** `npx tsc --noEmit`, `npx vitest run`, and one `npx vite build --outDir .superpowers/dist-check` are all green. There is no unit test for the view; T6 checks it in the browser.
- [ ] **Step 5: Commit:** "Draw the owner in the chosen outfit, from every side and while walking"

### Task 4: Texts and the wardrobe

**Files:**
- Create: `src/view/outfits.ts`, `tests/view/outfits.test.ts`, `src/scenes/WardrobeScene.ts`
- Modify:
  - `src/strings/vi.ts`;
  - `src/main.ts` (register `WardrobeScene`);
  - `src/scenes/QuestsScene.ts` (the button in the Thành tựu tab);
  - `src/scenes/OwnerScene.ts` (the button in `edit` mode);
  - `src/scenes/SpaScene.ts` (`wearOutfit` handler).

**Interfaces:**
- Produces from `src/view/outfits.ts`:
  - `OUTFIT_NAME: Record<OutfitId, StringKey>`
  - `wardrobeHead(badges: number, open: number): string`
  - `outfitStatus(id, worn: OutfitId, unlocked: OutfitId[], badges: number): { text: string; ok: boolean }`
  - `outfitTileTag(id): string | null`: "Cần N", "Spa của năm", or null when open
  - `newOutfitHead(id): string`
  - `newOutfitMore(n: number): string | null`
- Produces `WardrobeData { sim: SpaSim; onWear: (id: OutfitId) => void; onClose: () => void }`.
- `QuestsData` and the owner card's data gain `onWear`.
- `SpaScene.wear(id)`:
  1. `sim.wearOutfit(id)`;
  2. `rebuildOwner()`;
  3. `queueToast(t('outfitWornToast', { name }))`;
  4. `session.saveNow()`.

- [ ] **Step 1: Write the failing text tests.**
  - `wardrobeHead(9, 5)` → "Có 9/20 huy hiệu · mở 5/9 bộ".
  - `outfitStatus` covers the four states. The text "Cần 12 huy hiệu · còn 3 nữa" is for `tile` at 9 badges.
  - The tags and heads read as in Global Constraints.
  - `newOutfitMore(0)` is null; `newOutfitMore(2)` is "và 2 bộ khác trong Tủ áo".
- [ ] **Step 2:** Add the strings verbatim from Global Constraints. The 9 outfit names are the spec's table names.
- [ ] **Step 3: Build `WardrobeScene`** after the sketch's `drawWardrobe`:
  - card 50/150/980/1900;
  - title y 225, head y 290;
  - preview at y 795, scale ≈2.85, dimmed to 0.45 when locked;
  - name y 850, status y 898 (teal when ok, terracotta when not);
  - 3×3 tiles 290×300, gap 16, from y 945:
    - small owner at scale ≈1.15;
    - the name, wrapping to two lines;
    - locked tiles have a dashed edge, a 0.38 figure, the lock and the tag;
    - the worn tile has a teal tick;
    - the picked tile has a thick teal edge;
  - "Xong" at (300, 1955) 380×120, and "Mặc bộ này" at (760, 1955) 420×120. "Mặc bộ này" is inert when the outfit is locked or already worn.
  - Tapping a tile picks it. Opening the wardrobe picks the worn outfit.
  - Every figure is a real `CharacterView` built with `ownerColors(look, id)`.
- [ ] **Step 4: Open the wardrobe from two places.**
  - The Thành tựu tab button on the right of the header row reads "Tủ áo · {open}/9 bộ" and must not overlap the "badgesCount" text.
  - The owner card's `edit` mode has a "Tủ áo" button beside the preview.
  - Both launch `WardrobeScene` on top and return to their panel on Xong. After wearing, the owner card's preview shows the new outfit.
- [ ] **Step 5:** `tsc`, `vitest` and `vite build` are green.
- [ ] **Step 6: Commit:** "Add the wardrobe, opened from the achievements tab and the owner card"

### Task 5: The Áo mới card and the year card's line

**Files:**
- Create: `src/scenes/NewOutfitScene.ts`
- Modify: `src/main.ts`, `src/scenes/SpaScene.ts`, `src/strings/vi.ts` (`yearTrophy` copy), `tests/view/rank.test.ts`

**Interfaces:**
- Consumes `sim.newOutfits()` and `sim.markOutfitsSeen()` from Task 1, the text helpers from Task 4, and `SpaScene.wear`.
- Produces `NewOutfitData { sim; id: OutfitId; more: number; onLater: () => void; onWear: () => void }`.

- [ ] **Step 1: Write the failing test.** The year card's first-win lines include "Lần đầu nên có thêm cúp vàng (vào Xây dựng) và áo dài Spa của năm.". Update the existing `yearTrophy` expectation.
- [ ] **Step 2: Build `NewOutfitScene`** after the sketch's `newOutfitCard`:
  - dim the screen;
  - gold-pale card 110/380/860/1300;
  - head y 470 in terracotta;
  - gold glow ellipse at y 1040;
  - owner at y 1050, scale ≈3.1, wearing the new outfit;
  - name y 1130 at size 50;
  - the line, wrapped, from y 1200, plus the "và N bộ khác" line under it when `more > 0`;
  - "Để sau" at (340, 1540) and "Mặc thử" at (740, 1540), each 340×120;
  - play `levelUp` on open.
- [ ] **Step 3: Wire the card in `SpaScene`.**
  - When the shop is free, show the card. Free means: not `modal`, not holding, not paused, not `dayOver`, nobody being served, the badge queue empty, `now >= badgeUntil`, and the morning banner done.
  - When free and `sim.newOutfits()` is not empty:
    - set `modal`;
    - launch the card for the last id, with `more = ids.length - 1`.
  - On either button:
    - `sim.markOutfitsSeen(ids)`;
    - clear `modal`;
    - on "Mặc thử", `wear(id)`;
    - `session.saveNow()`.
  - The card must not open over the summary, the grade cards or a mini-game.
- [ ] **Step 4:** `tsc`, `vitest` and `vite build` are green.
- [ ] **Step 5: Commit:** "Show the Áo mới card when an outfit unlocks, and name the Spa của năm áo dài on the year card"

### Task 6: Browser check and ship

- [ ] **Step 1: Run a dev preview at iPhone width.** Build it with `NODE_ENV=development npx vite build --outDir .superpowers/dist-dev` and serve it with `vite preview`. Drive it with `window.__spa`, using inject saves made from `save-v19.json` by a scratch script. Check:
  1. A shop on day 8 with 9 badges: after the morning banner, one Áo mới card (hồng sen, "và 3 bộ khác"). "Mặc thử" changes the owner and shows the toast. A reload with the card open shows it again.
  2. The wardrobe from the Thành tựu tab and from the owner card (via Pause). All 9 tiles, locked tags, worn tick. "Mặc bộ này" is inert for locked and worn outfits.
  3. The owner in every áo dài and hat, facing down, side and up. Walk around and up the stairs to floor 2, then back.
  4. A day-36 first win, the next morning: the year card has the áo dài line and fits, then the Áo mới "quà Spa của năm" card.
  5. Staff look unchanged.
- [ ] **Step 2: Ship.**
  - Run the whole-branch review and fix what it finds. `npx vitest run` must be green.
  - Fetch, and check that `origin/master` is still an ancestor and that the branch holds only this lô's commits.
  - Fast-forward master, push, and record the ship in memory.
