# harborglow — Weekly Plan

## Today's focus
**2026-04-19 — New Idea mode.** Tune crane-to-ship physics attachment: eliminate snap-to jitter when a payload binds to an attachment point, tame rope/cable oscillation after release, and make joint stiffness/damping framerate-independent. Top Active focus area per PROJECT CONTEXT and has received zero direct work in the last 3 PRs.

## Ideas
<!--
Write ideas here during the week as they come to you.
Routine prioritizes these over generated ideas.
Format: - [ ] Short description (optional: more context on next line indented)
Routine will mark picked items as "[in progress — YYYY-MM-DD]".
-->
- [ ] Expand procedural ship blueprint set: ferry, fishing trawler, research vessel (half-to-full day). Blueprints pipeline exists but only 3 ships; more variety stresses upgrade-point generation and music-per-ship mapping.
- [ ] Music/event sync timeline: explicit sequencer wiring Tone.js Transport to cinematic triggers (spotlight hits, lyric reveals, camera cuts). Would replace ad-hoc setTimeouts in `audioVisualSync.ts` and friends. Multi-day.

## Backlog
<!--
Unfinished items, known bugs, deferred ideas.
Routine maintains this automatically — you can add items too.
-->
- [ ] HEARTBEAT.md is stale (dated Mar 8, 2026) — rewrite after today's build-run.
- [ ] Dead-code prune: `src/scenes/ControlBooth{,Example,Integration,Optimized,Swappable,WithMonitorSystem}.tsx` — only one is active; others are historical forks.
- [ ] Root-level codemod scripts (`fix_components.cjs`, `fix_deps.cjs`, `fix_hologram.cjs`, `fix_let_const.cjs`, `fix_lightshow.cjs`, `fix_lint.cjs`) appear to be one-shot post-refactor tools — either move to `scripts/` or delete.
- [ ] Only 1 TODO/FIXME left per HEARTBEAT ("crane interactivity") — confirm and close out.

## Done
<!--
Completed items, routine archives here with date.
Prune occasionally when this gets long.
-->
- 2026-04-13 — PR #5 merged: hook dependency cleanup, let→const pass.
- 2026-04-06 — PR #4 merged: R3F hooks-outside-Canvas fix, crane jib constants extracted.
- 2026-03 — PR #3 merged: large-component split. PR #2 merged: fullscreen canvas + booth immersion.

## Last run
<!-- Routine writes summary here each run. Overwrites previous. -->
Date: 2026-04-19
Mode: New Idea (weekly_plan.md did not exist; Ideas empty)
Focus: Crane-to-ship physics attachment tuning (jitter, oscillation, framerate-independent joints)
Outcome: _pending end-of-day_
