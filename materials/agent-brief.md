# Agent brief - shared by every fan-out page of learn-yoga-flow-design-with-phoebe

Filled from the course-builder agent-brief template on 2026-11-25. Internal build document: never
link it from an audience page.

You are writing ONE static HTML session page. No servers, no npm. **If your target file already
exists on disk, do not write it; report that and stop.** Write the file, return its path and one
line of coverage. No HTML in your reply.

Repo root: `/Users/phoebe/learn-yoga-flow-design-with-phoebe`

## Read first, in this order

1. The template page. Copy its structure, classes, SVG grammar and quiz markup EXACTLY, including
   4 options per question: `courses/01-a-flow-is-a-path.html` (never edit it).
2. The source map: every verified number, its tier, per-session coverage, the seams, the bench
   canon. Use ONLY its numbers; never invent a statistic; if a fact is missing, teach the
   uncertainty: `materials/official-course-map.md`.
3. Pose data if you name a pose's base, level, facing, effort or a transition's unit cost (they
   must match): `materials/build_fb_data.py` (POSES, COMPOSITES, RULES, the five rungs). To get an
   exact unit cost or bench number, run:
   `export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH"; cd /Users/phoebe/learn-yoga-flow-design-with-phoebe; node -e 'var FB=require("./assets/fb-live.js"); console.log(FB.units(["dog","",0,1],["lowlg","R",0,1]))'`
   and `python3 materials/fb_reference.py` for the whole ladder. Never compute a bench number in
   your head.

## Page skeleton (keep every component)

toolbar (crumb EXACTLY "learn-yoga-flow-design-with-phoebe / Session N of 6", #toggle-all,
#zoom-toggle) · masthead (eyebrow "Learn Yoga Flow Design with Phoebe · Session N of 6", h1 with
one `<span class="accent">`, .sub, .chip-row with the level chip (🟢 Foundations for session 2,
🟡 Core for session 3, 🟠 Deeper for sessions 5 and 6), then audience chip "Aspiring and new yoga
teachers", one more audience chip (e.g. "Pen and paper", "A mat and a timer"), and the time chip
"45 min", .agenda a1-a4) · main.wrap · section#intro (Part 0: kicker, .lede, the not-medical-advice
.callout.tip, .legend pills, .callout.win "★ What you walk out with tonight") · 3 Parts, each
`section.section#part-N` with section-kicker (klabel "Part N · covers ...", h2, `.tag.concept "N min
live"`), a `.lede`, ONE figure, `details.card` accordions (summary: `.mode.live` or `.mode.self`,
title, `.mini`, `.caret ▶`), and at least one `.callout.example` with `span.ex-pill` "Real world" on
the page · section#demo-1 Build-along (kicker `.tag.demo "★ 22 min · everyone builds"`, .lede, ONE
figure, `.steps > .step`, each with a `.prompt-box.good` carrying a `span.label`) · section#exercise
Homework (ol, 4 items) · section#quiz (3 x `.quiz-q data-answer="0-based"`, `p.qtext`, 4 x
`button.qopt` "A · ...", `p.qwhy`; one `p.quiz-score` after the last) · section#official, h2 EXACTLY
"What this session teaches, and where it came from", `.covered > .covered-row` (pill solid ✓ / light
◐ + name + note), then the `.mono` line EXACTLY "Every fact on this page, and its verification tier,
is recorded in the course's source map." · section.cheat#cheatsheet (h3 "Session N cheat sheet
<span>· pin this</span>", .grid-2 of six .cheat-item) · `.callout.next` with `.nx-pill` "Next
session" · footer.pagefoot · `<script src="../assets/app.js?v=1"></script>`.

Head: the template's social meta block with this page's own title/description/url;
`<title>Session N · <Title> - learn yoga flow design with phoebe</title>`;
`<link rel="stylesheet" href="../assets/style.css?v=1">`. Nothing else external.

First `details.card` in the FIRST Part is `open`; no other. Sentence case headings. Warm
practitioner voice, concrete, never dry. Inside prompt-boxes escape `&` `<` `>` (write `-&gt;`).
450 to 650 lines is guidance about depth, never a target.

## Hard rules (a violation is rework)

- NEVER an em dash or en dash, anywhere (prose, code, aria-labels, comments). Hyphen only.
- No meta text: never "this course", "in this course", "the course teaches", "banned here". State
  the professional norm directly with its reason. The two exact phrases above are the only
  self-references; "session 4" cross-references are fine.
- Attribution "by Phoebe Fu". Never "built with" a tool.
- Every number comes from the map or the bench. Bench numbers are labelled constructed or modelled.
- Contested or missing evidence: teach the disagreement or the gap; never resolve it. In
  particular: no study measured breath rate in a moving class; no study measured where in a class
  injuries happen; breath-movement pairing is a convention.
- Citations in the exact short form of the map's appendix. Tiny samples get their size said
  (Mody: 6 people).
- NEVER "lottery" or "lotteries"; say the mechanism.
- Default to the English word. Pose names in English (as in build_fb_data.py). Any non-English term
  (Sanskrit included) carries its English in brackets right after it, every occurrence.
- Ids and class names: figure prefixes are yours (below); never use ids or classes starting `fb-`
  (reserved for the bench) or `f1` (session 1).
- **Seams.** Never re-teach Yoga Theory: the arc of one class, vinyasa krama, the peak-pose method,
  sun salutations A and B (s7), cueing (s8), pranayama (s9). Link them as inputs. Never re-teach
  Yoga Course Design: intake and flags (s2), progressions across weeks, blocked vs random practice
  and periodisation (s3), mixed-level differentiation research and UDL (s5). Link them.
- **Health rules.** NOT medical advice: never diagnose, never dose, never promise a symptom outcome.
  The teacher adapts and refers, never assesses. Every movement you SHOW has: a hand-drawn
  stick-figure SVG labelled "guide" (never an AI image, never "demo"), breaths or seconds, a safe
  range in words, and a "Stop if" line in red-ink `#991B1B` (in the figure or in a prompt-box
  directly below it).
- Quiz `data-answer` values for YOUR page are given in your outline. Use exactly those.

## Figure grammar (hand-drawn, every figure)

Palette, ONLY these hexes: ink `#2A1A28` · muted `#66566A` · dusk orchid primary `#9E4F92` · deep
`#6E3463` · mid `#874380` · soft `#E6C3DF` · tint `#FAF0F8` · faint `#D9C9D6` · hairline `#EEE3EC`
· sea teal `#0F6B6B` · teal ink `#0B5252` · teal tint `#E5F3F2` · `#FFFFFF` · universal reds
`#991B1B` `#FEF2F2` `#FCA5A5` only for a wrong-way panel or a Stop-if line.

- `<figure class="zoomable">` > `<svg viewBox="0 0 880 H" xmlns="http://www.w3.org/2000/svg"
  role="img" aria-label="the data, not the shape">` > `<defs>` + `<style>` + content, then
  `<figcaption>🔍 Click to zoom - takeaway</figcaption>`. Grow H, never W.
- Prefix unique per figure, used for every class and id: `f<session><letter>` (session 2 uses f2a,
  f2b, f2c, f2d; session 3 f3a...; 5 f5a...; 6 f6a...).
- `<defs>` holds a wobble filter `id="PSk"` exactly as in the template, optionally a hachure
  pattern `id="PHc"` (as template, stroke `#9E4F92`), optionally an arrowhead marker `id="PAr"`
  (path `M1 1 L9 5 L1 9`, fill none, ink stroke 1.6). ALL shapes sit inside ONE `<g
  filter="url(#PSk)" fill="none" stroke="#2A1A28" stroke-width="2" stroke-linecap="round"
  stroke-linejoin="round">`; rects carry a tiny rotation (-4 to 4 deg for hand-placed items, under
  1 for panels). Fills: white, tint, hachure for "the pile", and teal tint with teal stroke ONLY for
  the one thing the figure is about. Never text directly on hachure.
- Text classes: `.PH` 800 12px ink heading · `.PL` 600 12px ink label · `.PS` 400 11px muted ·
  `.PB` 800 11px teal-ink `#0B5252` · `.PV` 800 16-20px deep value · `.PW` 800 12px white on primary
  or deep fill only · `.PA` 700 11px primary caption · `.PN` 400 12px muted note · `.PR` 800 11px
  `#991B1B` for Stop-if and wrong-way labels only.
- ALL `<text>` outside the filtered group, never below 10.5px.
- Fit: max chars ≈ (box width - 20) / 7 at 12px, 6.4px/char at 11px; full-width note under 110
  chars; 40px between neighbouring point labels; H clears the bottom note by 8px or more.
- Geometry the gate rejects: two filled rects that PARTIALLY overlap; ANY path or line crossing a
  text label (route connectors around labels, e.g. straight down, across below the labels, then
  down); text overlapping text; anything outside the viewBox.
- **Stick figures** (movement guides): head `<circle r="10-12" fill="#FFFFFF"/>`, body and limbs as
  paths inside the filtered group, a primary-colour arrow path for the direction of movement, a
  step label under each figure. 3 or 4 figures across 880 for an options ladder. Heading or note
  says "guide". Each figure carries (in text under it, clear of limbs) a hold in breaths, a safe
  range, and a "Stop if" line in `.PR`, OR those lines appear in a prompt-box directly below.
- Floor: one figure per Part plus one in the build-along. Draw the MECHANISM, never decoration.

## Voice and honesty

Every Part gets a real-world story (a familiar studio pattern, stated as a pattern, never a
fabricated named studio or statistic). Constructed case: **Rosa**, a newly qualified teacher;
**the Harbour Room**, a constructed community studio; her 60-minute Thursday flow class. Say
"constructed" the first time Rosa appears on a page. You may invent first names for constructed
students if labelled constructed. Never use Phoebe's own work, employers or clients.

## Cross-links (absolute URLs)

- Yoga Theory: https://phoebefu6.github.io/learn-yoga-theory-with-phoebe/ (s5 courses/05-functional-anatomy.html, s6 courses/06-asana-theory.html, s7 courses/07-course-flow.html, s8 courses/08-cueing-analogy.html, s9 courses/09-pranayama-meditation.html)
- Yoga Course Design: https://phoebefu6.github.io/learn-yoga-course-design-with-phoebe/ (courses/02-intake-who-is-in-the-room.html, 03-progressions-across-weeks.html, 05-one-room-many-levels.html)
- Stress Control: https://phoebefu6.github.io/learn-stress-control-with-phoebe/
- Hub: https://phoebefu6.github.io/learn-with-phoebe/

## Footer chain and session titles

Footer left: "Session N of 6 · learn-yoga-flow-design-with-phoebe · by Phoebe Fu &nbsp;·&nbsp; 📚 <a href="https://phoebefu6.github.io/learn-with-phoebe/">Learn with Phoebe ↗</a>"
Footer right: `<a href="PREV">← Prev: <title></a> &nbsp;·&nbsp; <a href="NEXT">Next: <title> →</a>`
(session 6: "← Prev: Repetition and the wave" and `<a href="../index.html">Course home</a>`).

Session titles and files (exact, sentence case, one accent span in h1):
1. A flow is a path, not a list - 01-a-flow-is-a-path.html
2. Breath is the clock - 02-breath-is-the-clock.html
3. Transitions that work - 03-transitions-that-work.html
4. The Flow Bench - 04-the-flow-bench.html
5. Repetition and the wave - 05-repetition-and-the-wave.html
6. Adapting a flow live - 06-adapting-a-flow-live.html
