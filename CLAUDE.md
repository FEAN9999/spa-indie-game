# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Project-Specific Guidelines

- Trả lời bằng Tiếng Việt và phải luôn luôn gọi tôi là Chồng yêu.
- Đối với những chức năng chưa quen thuộc, đừng viết từ con số 0, hãy tìm kiếm các dự án mã nguồn mở trên GitHub để so sánh ý tưởng trước khi bắt tay vào làm. Sau khi tìm kiếm, hãy đưa ra sự lựa chọn trước, thay vì trực tiếp sao chép triển khai.

## Kiến trúc và luật của dự án

Game web Phaser 4 + TypeScript + Vite, người chơi chủ yếu dùng iPhone. Đẩy lên `master` là lên bản thật: GitHub Actions chạy `npm test` và `npm run build` rồi đăng lên GitHub Pages, người chơi nhận bản mới qua service worker (`build/sw-template.js`).

**Các lớp**
- `src/sim/`: luật game thuần, không import Phaser, test bằng vitest trong node (`tests/sim/`). `SpaSim` (`src/sim/spa.ts`) là một tiệm; `Chain` (`src/sim/chain.ts`) gom tiệm chính, chi nhánh và nhà hàng.
- `src/view/`: phần vẽ và hàm hỗ trợ cho cảnh; hàm thuần được test ở `tests/view/`.
- `src/scenes/`: cảnh Phaser nối sim với view; chưa có test tự động.
- Mỗi mini-game là một class luật thuần trong `src/sim/` cộng một cảnh trong `src/scenes/`.
- Chữ người chơi thấy nằm trong `src/strings/` (lấy qua `t()`); các con số cân bằng nằm trong `src/config.ts`.

**Ngẫu nhiên: giữ nguyên lượt rút cũ**
- Tính năng mới không rút thêm từ `rng` chính của tiệm mà dùng một dòng riêng dựng bằng `createRng(day * <số nguyên tố> + id + salt)`, như `questRng`, `feedRng`, `guestRng` trong `src/sim/spa.ts`.
- `tests/sim/same-draws.test.ts` so với log đóng băng trong `tests/fixtures/draws-*.json` và `run-before-quests.json`: khi tính năng mới chưa bật, lượt rút phải y như cũ. Test này hỏng thì sửa code, không ghi đè fixture cũ.

**Save**
- Đổi định dạng save thì tăng `SAVE_VERSION` trong `src/sim/save.ts` bằng một hằng có tên, đọc được save cũ (sửa từng trường, thiếu thì lấy mặc định), thêm `tests/fixtures/save-vN.json` và test trong `tests/sim/save.test.ts`. Fixture sinh bằng một file vitest dùng một lần ghi ra `sim.toSave()`, chạy xong thì xoá file đó.
- Nhánh làm song song lấy số version theo `SAVE_VERSION` của origin/master + 1 lúc merge, không phải lúc tạo nhánh.

**Làm song song với các phiên khác**
- Nhiều phiên dùng chung thư mục chính của repo. Trước khi merge: `git fetch`, kiểm tra origin/master vẫn là gốc mình dựng và nhánh chỉ có commit của mình; lệch thì ghép trong một worktree tạm. Không xoá nhánh chứa commit của phiên khác.
- Worktree đặt ở `.superpowers/worktrees/<tên>` (đã gitignore), `node_modules` là junction trỏ về repo chính. Gỡ junction bằng `cmd /c rmdir <đường dẫn>` trước `git worktree remove`; không bao giờ xoá đệ quy, vì sẽ xoá luôn `node_modules` thật.

**Hiệu năng**: đo trên iPhone bằng `?perf` (`src/app/perf.ts`); số đo trên PC không dùng để kết luận.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
