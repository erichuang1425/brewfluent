# BrewFluent ☕

**Say it softer — without losing the point.**

BrewFluent is an English-pragmatics trainer for people who can already speak
English but keep landing on the wrong side of *tone* — too blunt and they read
as rude, too hedged and they read as a doormat. It teaches the small social
"softeners" of everyday workplace English (requests, disagreement, refusals,
feedback) and then makes you actually use them in live, AI-driven roleplay.

The signature mechanic is the **Steep Gauge**: softening is a brew. Under-brewed
is blunt, over-steeped is a pile of nervous hedges, and the sweet spot in the
middle is *just right* — polite but unmistakable.

> **Status:** early prototype (pre-MVP). This repo currently holds the
> interactive prototype that proves the core loop. See
> [`docs/plan-addendum-solo-rescope.md`](docs/plan-addendum-solo-rescope.md) for
> the full product plan and phasing.

---

## The core loop

```
DRILL  →  TRANSFER  →  ROLEPLAY  →  BANK
```

1. **Drill** a pack of softeners in two cheap formats — *tap-to-choose* and
   *rewrite* (the rewrite is scored live by Claude).
2. **Transfer** the patterns you just practised — especially the ones you
   missed — into a short, live **roleplay** with a Claude-played NPC who
   deliberately creates openings for them. Drills teach the pattern; the
   roleplay is where it sticks.
3. **Bank** every miss into a spaced-repetition **mistake bank** that brings it
   back for review (correct review → interval doubles; miss → back tomorrow).

A daily **quest** (finish a pack + carry it into a roleplay) drives a **streak**.

---

## Prototype stages (this repo's three PRs)

The prototype evolved in three stages, delivered as three stacked PRs that each
advance the single canonical file [`src/BrewFluent.tsx`](src/BrewFluent.tsx):

| Stage | PR  | What it adds |
|-------|-----|--------------|
| **1 — MVP base** | pr1 | 2 drill packs (Requests, Disagreement), tap + rewrite formats, streak + daily quest, drill→roleplay transfer with a Claude NPC. In-memory only. |
| **2 — Persistence + mistake bank** | pr2 | Real persistence via `window.storage` (streak, quest, mistake bank survive reloads). Spaced mistake bank with interval-doubling review. |
| **3 — Ambient surface** | pr3 | New-tab "Softener of the Day" widget (the cheapest ambient micro-exposure surface) + normalized hit-matching for more reliable target detection. |

Beyond the three prototype stages, the repo now also carries the first **v1**
content: drill packs 3–5 (Refusals, Feedback, Closers) and the **flagship
branching scenario**.

### Flagship scenario — *Asking for the raise*

The v1 signature piece: one hand-built branching scene (not a scenario engine —
per the solo rescope, you ship *one instance* of the thing an engine would
generate). You walk a real raise conversation beat by beat; each beat is a
pick-the-brew choice whose verdict moves a **rapport meter** (hardcoded), the
NPC's reply branches on your pick, and the **ending** branches on your final
rapport — *commitment*, *door left open*, or *stalled*. Blunt and over-steeped
beats are banked into the same spaced mistake bank, so the flagship still closes
the `drill → … → bank` loop. It's fully hardcoded — no model call — so it can
never degrade.

---

## Tech

- **UI:** React (single-file prototype component, TSX).
- **AI:** Claude (`claude-sonnet-4-6` in the prototype) for two jobs —
  scoring rewrites (`scoreRewrite`) and playing the roleplay NPC
  (`roleplayTurn`). Both have offline heuristic fallbacks so the UI degrades
  gracefully.
- **Persistence:** `window.storage` key/value (prototype host runtime).
- **Type / design:** Fraunces (display) + Karla (body); a warm, earthy
  leaf/copper/mist palette defined in the `T` token object.

> ⚠️ **Security:** the prototype calls the Anthropic API directly from the
> client. This is only safe inside the prototype host runtime, which injects
> auth. **A real build must never ship an API key to the browser** — route all
> model calls through a backend proxy. See `CLAUDE.md` → *Security*.

---

## Repo layout

```
.
├── CLAUDE.md          # Primary guide for developing this project (read first)
├── README.md          # You are here
├── LICENSE            # Proprietary — all rights reserved
├── src/
│   └── BrewFluent.tsx # The evolving prototype (stage 1 → 2 → 3 across the PRs)
└── docs/
    └── plan-addendum-solo-rescope.md  # Product plan & phasing (solo rescope)
```

> Note: the working folder on disk is named `Velvet` — an earlier rename that
> was reverted. The product is **BrewFluent**; ignore the folder name.

---

## Roadmap (solo edition, abbreviated)

| Phase | Highlights |
|-------|-----------|
| **MVP (mo. 0–6)** | 2 packs, tap/rewrite, streaks, drill→roleplay transfer |
| **v1 (mo. 7–14)** | Packs 3–5, mistake-bank, 1 flagship branching scenario, self-authored tips library, Pressure Mode, new-tab widget |
| **v1.5 (mo. 15–22)** | Speech-scored drills (API), full skill tree, private Scenario Studio |
| **Post-traction** | Leagues, scenario marketplace, creator video feed, native shells & widgets, Register Rewriter |

Full detail and rationale in
[`docs/plan-addendum-solo-rescope.md`](docs/plan-addendum-solo-rescope.md).

---

## License

Proprietary. Copyright © 2026 erichuang1425. All rights reserved. See
[`LICENSE`](LICENSE). The repository is public for reference only; no rights to
use, copy, or modify are granted.
