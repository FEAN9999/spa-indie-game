# Thú cưng lô A — kế hoạch

Spec: `docs/superpowers/specs/2026-10-29-thu-cung-design.md`. Branch `thu-cung`, worktree `.superpowers/worktrees/thu-cung`, cut from master 4b34ca2. Sketch source: session 73b609f4 scratchpad `sketch/pets.js`.

Run `npx vitest run` and `npx tsc --noEmit` after every task. Match the surrounding code: one-line doc comments on exports, no semicolons, single quotes, 2-space indent, long lines allowed.

## Task 1 — sim and save (`src/sim/pets.ts`, `spa.ts`, `save.ts`, `chain.ts`, `config.ts`)

- `src/sim/pets.ts`:
  - `BREED_IDS` (`muop, mun, tamthe, xiem, chota, phuquoc, corgi, poodle`) and `BreedId`.
  - `BREEDS: Record<BreedId, { kind: 'cat' | 'dog'; price: number; name: StringKey; names: [string, string, string] }>`, with the prices from spec 4.1.
  - `FREE_BREEDS = ['muop', 'chota']`.
  - `Pet { id, breed, name }` and `PetBook { owned: Pet[]; nextId: number; litter: boolean }`.
  - `emptyPetBook()`, `branchPetBook()` (litter true), `cleanPetName(raw, fallback)` (like `cleanShopName` with `PET_NAME_MAX = 12`).
  - `repairPets(x)` per spec 5.
- `config.ts`: `MAX_PETS = 6`, `PET_NAME_MAX = 12`, `LITTER_FROM_DAY = 2`.
- `SpaSim.pets: PetBook`, with these methods:
  - `litterDue()`: main shop, not `litter`, `day >= LITTER_FROM_DAY`, `profileDone`, under `MAX_PETS`.
  - `takeLitter(breed, name)`: only a free breed while due; sets `litter`; returns a `Pet` or null.
  - `adoptPet(breed, name): PetProblem | null`, where the problem is `'full' | 'money' | 'main'`. It pays the price like buying furniture.
  - `renamePet(id, name): boolean`
  - `giveAwayPet(id): boolean`
  - When the shop reaches `MAX_PETS` with `litter` false, `litter` becomes true.
- Saving:
  - `toSave`/`fromSave` carry `pets`. A branch always gets `branchPetBook()`.
  - `SAVE_VERSION = 32`, with 31 accepted in `parseVersioned`.
  - `parseShop` runs `data.pets = repairPets(data.pets)`.
- Tests:
  - `tests/sim/pets.test.ts` covers repair and the name.
  - `tests/sim/spa-pets.test.ts` covers litter, adopt, rename, give away, branch, and a JSON round trip.
  - `tests/sim/save.test.ts`:
    - add a `describe('save version 32')` with `v31` (`parseSave(v31)` equals `withNewKeys(v31)`; it opens with `pets` empty and `litter` false; `toSave().v` is 32);
    - `withNewKeys` adds `pets` to every shop (branches `litter: true`);
    - the old `'is 31'` test becomes a check of the v30 → current path, without the version pin.

## Task 2 — art (`src/art/pets.ts`, `BootScene`)

- Port the sketch's `pets.js` to TypeScript. Keep it as is: same breeds' colours, `petBody(breed, pose, opts)`. Use `BreedId` from `src/sim/pets.ts`.
- `PET_POSES = ['walk0', 'walk1', 'sit', 'wag', 'happy', 'sleep']`. `wag` is the sit pose with the tail to the other side and the tongue out.
- `petTextures()` returns the keys `pet-<breed>-<pose>`, each `svgDoc([-50, -70, 100, 76], PET_PX, shadow + body)`, where `PET_PX = 1.55` and a soft shadow ellipse sits at the feet.
- Export `PET_ORIGIN = { x: 0.5, y: 70 / 76 }`.
- Register the textures in `BootScene`.
- Test: `tests/art/pets.test.ts` checks that every key exists and that no SVG has `NaN` or `undefined`.

## Task 3 — brain (`src/view/petBrain.ts`)

- Pure, with no Phaser.
- `PetMind { id, breed, pos: Vec, path: Tile[], state: 'walk' | 'sit' | 'sleep', leftMs, why: 'wander' | 'follow' | 'greet', step, stepMs, climbMs? }`.
- `newMind(pet, grid, rng)` puts the pet on a random floor-1 walkable tile. The rng is the view's own, not `sim.rng`.
- `stepMind(m, dtMs, world, rng)`, where `world = { grid, owner: Tile, ownerMoving: boolean, door: Tile, night: boolean }`:
  - Movement is like `moveAlong`: a step onto another floor waits `STAIRS_MS`.
  - Walking flips `step` every 160 ms.
  - Arriving sits; `wag` is set when `why` is follow or greet.
  - A dog sitting by the owner re-follows when the owner moves and is more than 2 tiles away.
  - At night everyone sleeps where they are.
- `think` uses the weights and times from spec 4.5. Destinations are random walkable tiles (`isWalkable`, not a bed) on open floors; follow goes next to the owner; greet goes one or two tiles in from the door.
- `settle(m, grid, rng)`: when the pet's tile is not walkable (furniture was placed), jump to the nearest walkable tile and drop the path.
- Pose for drawing: `poseOf(m)` returns `walk0 | walk1 | sit | wag | sleep`.
- Tests in `tests/view/petBrain.test.ts`:
  - pets stay on walkable tiles over 10 simulated minutes on the default grid;
  - cats sleep more than dogs;
  - dogs end near the owner more than cats do;
  - at night everyone sleeps;
  - settle;
  - a path across floors.

## Task 4 — sounds (`src/audio`)

- `Sfx` and `OneShot` gain `meow` and `woof`, with throttles of 300 ms.
- Add recipes to `sounds.ts`, styled like `huff`:
  - meow: a sawtooth through a moving bandpass, about 0.5 s;
  - woof: two square barks through a lowpass.
- Extend the existing audio tests if they enumerate sounds.

## Task 5 — view (`src/view/PetLayer.ts`, `src/scenes/LitterScene.ts`, `src/scenes/PetNameScene.ts`, `SpaScene`, strings, scene list)

- `PetLayer`:
  - It keeps a map from pet id to `{ mind, image, z: Text[] }`.
  - `sync(sim)` adds and removes pets to match `sim.pets.owned`, but only while `sim.place === null`; otherwise everything is hidden.
  - `update(sim, dt, world)` steps the minds, then sets each texture, flipX by facing, position from `room.tileToWorld`, and depth `y`. A pet is visible only on the floor in view; z letters float over sleepers.
  - `pat(id)` makes the pet hop (tween), shows a pill with the name and a heart rising, and plays `sound.play('meow' | 'woof')`.
  - Images are interactive; `SpaScene.onTap` ignores tile taps when `over` holds a pet image, and calls `pat` instead, unless modal.
  - `world.night` is true when `sim.dayOver` or `clock.minutes >= DAY_END`.
  - After build mode closes, `settle` all.
- `PetNameScene` follows spec 4.3:
  - Data: `{ breed, name?, price: number | null, mode: 'adopt' | 'rename', onDone(name), onCancel }`.
  - It uses `nameInput` with `PET_NAME_MAX` and three suggestion buttons, and draws the pet's sit texture at scale 2.2.
- `LitterScene` follows spec 4.2:
  - Chú Sáu is drawn with `CharacterView` and `customerColors(REGULARS.sau.look, 'elder', 'sau')`.
  - It has two tiles (Mèo mướp, Chó ta) and a "Để sau" button.
- In `SpaScene`:
  - After `showNewOutfits`, if `shopFree()` and `sim.litterDue()` and `litterLaterDay !== sim.day`, run `showLitter()`. It sets modal, launches `LitterScene`, then `PetNameScene`, then `sim.takeLitter`, `session.saveNow()`, a toast "{name} về tiệm rồi!", and the pet walks in from the door.
- Strings go in `src/strings/vi.ts`. Register the scenes in `src/main.ts`.

## Task 6 — check and ship

- Run the tests and `tsc`.
- Do a browser check at 390 px with gstack `$B` on a `vite preview` build:
  - a v31 save shows Chú Sáu;
  - name and adopt;
  - tap to pat, with sound and heart;
  - no blocking;
  - other floors;
  - 20:00.
- Final review subagent.
- Merge into master, push, report.
