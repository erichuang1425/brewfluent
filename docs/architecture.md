# BrewFluent Architecture Notes

BrewFluent is an English-pragmatics prototype. It teaches advanced English
learners how to soften workplace communication without losing the point.

The app is intentionally small: one React component, authored content, simple
state, and a tight learning loop.

## Product Loop

```text
Drill -> Transfer -> Roleplay -> Bank -> Review
```

- **Drill:** learners practice softeners through tap-to-choose and rewrite
  prompts.
- **Transfer:** `transferTargets()` carries up to three patterns forward,
  prioritizing missed items.
- **Roleplay:** the learner uses those patterns in a short NPC conversation.
- **Bank:** missed targets enter a spaced mistake bank.
- **Review:** correct review doubles the interval; misses come back tomorrow.

The Steep Gauge is the main teaching visual. A low score is too blunt, a high
score is too hedged, and the middle is polite but clear.

## Source Layout

The product prototype lives in `src/BrewFluent.tsx`.

Important parts:

- `PACKS`: authored drill packs and roleplay setups.
- `SCENARIO`: the hand-built "Asking for the Raise" branching scenario.
- `TIPS` and `DAILY_SOFTENERS`: content for the new-tab-style widget.
- `scoreRewrite()`: model-backed rewrite scoring with heuristic fallback.
- `roleplayTurn()`: model-backed NPC turn generation with heuristic fallback.
- `loadStore()`, `saveStore()`, `wipeStore()`: prototype storage helpers.
- `SteepGauge`, `Btn`, `Chip`, `RapportMeter`: shared UI pieces.
- `BrewFluent()`: screen state machine and product flow.

Screens include home, drill, drill complete, review, roleplay, recap, widget,
branching scenario, and scenario recap.

## Content Model

```ts
{
  id,
  name,
  blurb,
  roleplay: { title, setup, npc },
  items: [
    { type: "tap", prompt, target, options: [{ text, verdict, gauge }] },
    { type: "rewrite", prompt, blunt, target, hint },
  ],
}
```

`verdict` is one of `"blunt"`, `"good"`, or `"overdone"`. `target` is the
softener pattern that gets transferred into roleplay and matched later.

## Model Calls

The prototype uses the Anthropic Messages API for two explicit user actions:

- scoring free-text rewrites
- generating NPC roleplay turns

Both call sites parse JSON responses and fall back to local heuristics if the
request fails or returns unusable text. Keep that graceful degradation. The app
should remain inspectable without live model access.

Do not ship browser-side model credentials in a real deployment. Put these calls
behind a backend route and keep secrets server-side.

## Persistence

The prototype expects an async key/value API at `window.storage`.

Keys:

- `bf:state`: streak, last completion date, and daily quest state
- `bf:mistakes`: mistake bank entries keyed by pack and item

If the storage keys ever change, read the old keys as a migration fallback.

## Design Notes

The visual system is defined by the `T` token object in `src/BrewFluent.tsx`.

- Layout: single mobile-first column, max width 460px.
- Type: Fraunces for display, Karla for body text.
- Palette: warm paper, leaf green, copper, mist, and muted ink.
- Accessibility: keep focus-visible styles and reduced-motion handling.

The copy should stay warm and direct. The product metaphor is brewing: steep,
brew, kettle, under-brewed, just right, and over-steeped.

## Scope Rules

- Protect the drill-to-roleplay transfer loop.
- Prefer authored content over new platform surfaces.
- Keep model calls explicit and user-initiated.
- Keep the single-component prototype easy to read until a real app scaffold is
  introduced.
- Do not build marketplaces, native shells, public user-generated content, or
  social systems before there is real traction.
