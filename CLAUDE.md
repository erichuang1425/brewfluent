# CLAUDE.md — BrewFluent

Primary guide for developing BrewFluent. Read this before touching code. It
captures the things that are **not** obvious from the source: the product
intent, the brand voice, the prototype's architecture, and the constraints that
must survive future work.

---

## 1. What BrewFluent is

An English-**pragmatics** trainer. The user can already speak English; what they
get wrong is *register / tone*. BrewFluent teaches the small social "softeners"
of everyday (mostly workplace) English and forces transfer into live practice.

- **Tagline:** *Say it softer — without losing the point.*
- **The problem space:** blunt → reads rude; over-hedged → reads weak. The skill
  is hitting the middle.
- **The wedge mechanic:** the **drill → roleplay transfer** loop (below). This is
  the pedagogical core and the thing to protect in every decision.

**Status:** early interactive prototype, pre-MVP. `src/BrewFluent.tsx` is a
single-file React component that proves the loop. There is no backend, no build
app, no auth yet — those are future work.

> **Naming history (important):** the on-disk folder is `Velvet`. The product
> was briefly renamed *Velvet* (a "softness/smoothness" metaphor) and then
> **reverted to BrewFluent**. Do **not** reintroduce velvet/smoothness
> vocabulary. The product is **BrewFluent** and the metaphor is **brewing/tea**
> (steep, brew, kettle). Keep it.

---

## 2. Operating principles (from the solo rescope plan)

These shape what to build and — more importantly — what *not* to build. Full
detail: [`docs/plan-addendum-solo-rescope.md`](docs/plan-addendum-solo-rescope.md).

1. **One codebase, zero native code until traction.** PWA-only. No Capacitor /
   native shells / app-store / keyboard hosting until post-revenue.
2. **Ship loops, not platforms.** Every "engine / studio / marketplace / creator
   program" is replaced at launch by *one hand-built instance* of the thing it
   would generate. (E.g. one flagship branching scenario, not a scenario engine.)
3. **No ops a solo dev can't carry.** Defer anything needing payouts, contracts,
   moderation pipelines, or commissioning.
4. **Inference only on explicit action.** No always-on / ambient model calls.
   Cap free-tier session length. This is a cost rule *and* an architecture rule.

When a feature request arrives, check it against these four before estimating.

---

## 3. The core loop (do not break this)

```
DRILL  →  TRANSFER  →  ROLEPLAY  →  BANK  →  (spaced review)
```

- **Drill:** a pack of softeners in two cheap formats — `tap` (pick the best of
  three phrasings) and `rewrite` (free text, Claude-scored).
- **Transfer:** `transferTargets()` selects up to 3 patterns to carry forward —
  **missed ones first**, topped up with nailed ones. These are injected into the
  roleplay prompt so the NPC creates natural openings for them.
- **Roleplay:** a short live chat with a Claude-played NPC (`roleplayTurn`). The
  NPC reports which targets the learner `hit`, optionally whispers a `coach`
  tip, and ends the scene with `done`.
- **Bank:** misses go into a spaced-repetition **mistake bank** (stage 2+):
  correct review → interval doubles; miss → due again tomorrow.

A daily **quest** = finish a pack **and** carry it into a roleplay. Completing it
advances the **streak**.

The signature UI element is the **Steep Gauge** (`SteepGauge` component): a
left→right gradient from *Blunt* to *Over-steeped* with a needle. `verdict` maps
to `"blunt" | "good" | "overdone"` and `gauge` is 0–100 (≈55 = the sweet spot).

---

## 4. Brand & voice — the brewing metaphor

Softening is a **brew**. Keep this vocabulary consistent; it is the product's
personality. **Never** swap in coffee-neutral or "velvet/smoothness" wording.

| Surface | Copy |
|---|---|
| Product name / logo | **Brew**Fluent (`Brew` ink, `Fluent` in leaf green) |
| Loading | "Warming the kettle…" |
| Submit a rewrite | "Check my brew" / busy: "Steeping…" |
| Verdict labels | Blunt → **Under-brewed**, sweet spot → **Just right**, hedged → **Over-steeped** |
| Finish a pack | "Pack steeped. ☕" |
| Streak unit | "{n} day steep(s) ◉" |
| Mistake bank | misses are "re-steeped"; cleared = "All steeped." |

Tone: warm, plain, encouraging, never clinical. Short sentences. The coaching
voice is a friendly peer, not a grammar teacher. Example feedback strings live
inline in `scoreRewrite` and the tap handler — match their register.

---

## 5. Design system

All visual tokens live in the `T` object at the top of `src/BrewFluent.tsx`:

```
bg #EDEFE6  surface #FBFBF7  ink #20251B  inkSoft #5A6150
leaf #3D5A2E  leafDeep #2C4220  copper #A8511C
mist #D9E3C8  line #CBD2BC  bad #8A3B2E
```

- **Type:** Fraunces (serif, display/headings, weights 500/650) + Karla
  (sans, body, 400/700). Loaded via Google Fonts `@import` inside the `shell`.
- **Layout:** single centered column, `maxWidth: 460` — mobile-first. Keep it.
- **Atoms:** `SteepGauge`, `Btn` (`primary` | `ghost`), `Chip` (`hot` = active).
- **A11y:** focus outlines via `:focus-visible`, and a
  `prefers-reduced-motion` block that kills transitions. Preserve both when
  adding UI.

---

## 6. Prototype architecture

Single default-exported component `BrewFluent()` driving a `screen` state
machine. Screens: `home`, `drill`, `review` (stage 2+), `drillDone`,
`roleplay`, `recap`, `widget` (stage 3). A `shell(children)` wraps every screen
with the background, font import, and centered column; `header` is the shared
top bar (logo + streak).

**Content model** — `PACKS` array:

```ts
{
  id, name, blurb,
  roleplay: { title, setup, npc },     // NPC = character + behaviour for the prompt
  items: [
    { type: "tap", prompt, target, options: [{ text, verdict, gauge }] },
    { type: "rewrite", prompt, blunt, target, hint },
  ],
}
```

- `verdict` is always one of `"blunt" | "good" | "overdone"` — this enum is load-
  bearing (drives scoring, gauge color, transfer). Do **not** rename it.
- `target` is the softener pattern string (e.g. `"Could you … when you get a
  chance?"`). It's what gets transferred and matched against roleplay hits.

**Claude integration** (`claude()` helper):

- POSTs to `https://api.anthropic.com/v1/messages`, model **`claude-sonnet-4-6`**,
  `max_tokens: 1000`. No streaming.
- Two call sites:
  - `scoreRewrite(item, answer)` → `{ verdict, gauge, feedback, model }`.
  - `roleplayTurn(pack, targets, transcript)` → `{ reply, hits, coach, done }`.
- Responses are parsed with `parseJSON` (strips ```` ``` ```` fences, falls back
  to a `{...}` regex grab). **Both call sites have offline heuristic fallbacks**
  so the UI never hard-fails if the model call errors or returns junk — keep
  this resilience when editing prompts.

**Persistence** (stage 2+) — `window.storage` async KV via
`loadStore/saveStore/wipeStore`:

- `bf:state` → `{ streak, lastCompletedDate, quest: { drill, roleplay, date } }`
- `bf:mistakes` → `{ "<packId>:<itemIdx>": { packId, itemIdx, target, interval, due, misses } }`

> Note: the keys are abbreviated `bf:*`. They're internal; if you ever want them
> to read `brewfluent:*`, rename and migrate existing values deliberately (read
> the old key as a fallback during the transition), not casually.

**Spaced repetition:** `dueItems` = entries with `due <= today`. `gradeReview`:
good → `interval *= 2`, `due = today + interval`; miss → `interval = 1`,
`due = tomorrow`. Dates are `YYYY-MM-DD` strings via `todayStr` / `addDays`.

**Hit matching:** stage 1 used naive substring matching; stage 3 added `norm()`
+ `hitMatch()` (lowercase, strip punctuation, collapse spaces, bidirectional
`includes`). Prefer `hitMatch` for any new target-detection.

---

## 7. Security (read before any "real app" work)

The prototype calls `api.anthropic.com` **directly from the browser with no
auth header**. This only works because the prototype host runtime injects
credentials. **In any real deployment this is a critical vulnerability** — an
API key shipped to the client is a leaked key.

When promoting beyond the prototype:

- Put all model calls behind a **backend proxy**. The browser talks to your
  server; your server holds the key and talks to Anthropic.
- Keep keys in env vars / a secret manager, never in source. `.env*` is
  gitignored — keep it that way.
- Enforce the **"inference only on explicit action"** rule at the proxy
  (rate-limit, session caps) so cost can't run away.

---

## 8. Model usage guidance

- Prototype uses `claude-sonnet-4-6` for everything. The plan's cost rule:
  **smaller/cheaper model for drills & classification, full model only for live
  roleplay turns.** Apply this when wiring the real backend.
- Latest model IDs (as of this writing): Opus `claude-opus-4-8`, Sonnet
  `claude-sonnet-4-6`, Haiku `claude-haiku-4-5-20251001`. For tone scoring,
  Haiku/Sonnet is plenty; reserve Opus for hard generative work if needed.
- All model calls must remain user-initiated (no background/ambient inference).

---

## 9. Roadmap & what's deferred

| Phase | Build |
|---|---|
| **MVP (0–6 mo)** | 2 packs, tap/rewrite, streaks, **drill→roleplay transfer** |
| **v1 (7–14 mo)** | packs 3–5, mistake-bank, **1 flagship branching scenario** (hardcoded rapport), self-authored **tips library**, **Pressure Mode**, **new-tab widget** |
| **v1.5 (15–22 mo)** | speech-scored drills (off-the-shelf API), full skill tree, **private** Scenario Studio (if metrics warrant) |
| **Post-traction** | leagues, scenario marketplace + moderation, creator video feed + payouts, native shells → OS widgets, **Register Rewriter** (everywhere layer) |

**Explicitly deferred — do not build early:** leagues, public marketplace /
UGC moderation, commissioned creators / payouts, native shells & OS widgets,
Duet / Wingman / Weekly Boss (need multiplayer or a real user base), Register
Rewriter (gated on proven in-app model + revenue for SOC 2 / privacy work).

---

## 10. Conventions for future work

- **Protect the loop.** New features earn their place by strengthening
  drill→transfer→roleplay→bank, not by adding parallel surfaces.
- **Keep the single 460px column** and the brewing voice (§4).
- **Keep graceful degradation** — every model call needs a sane non-AI fallback.
- **Keep `verdict` and `target` semantics stable** — lots hangs off them.
- **No new always-on inference.** Ever. (Cost + privacy.)
- **Author content like an author, not an engineer.** Drill packs are the
  highest-leverage work; AI-draft then hand-review. New packs slot into `PACKS`.
- Convert relative dates to absolute when noting plans (this is mo. 0 of the
  rescope timeline; MVP target window is the first 6 months).

---

## 11. This repo's three PRs (prototype stages)

The prototype is delivered as three **stacked** PRs that each evolve the single
file `src/BrewFluent.tsx`, so each PR's diff is the real stage-over-stage delta:

- **pr1 — Stage 1 (MVP base):** packs, tap/rewrite, streak/quest, transfer,
  Claude NPC. In-memory.
- **pr2 — Stage 2 (persistence + mistake bank):** `window.storage`, streak that
  survives reloads, spaced mistake bank with interval-doubling review.
- **pr3 — Stage 3 (ambient surface):** new-tab "Softener of the Day" widget,
  normalized `hitMatch`.

Base chain: `main` ← pr1 ← pr2 ← pr3.
