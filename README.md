# BrewFluent

**Workplace English tone practice for people who already know the words.**

BrewFluent is a React prototype for English pragmatics: the small phrases that
make a request sound reasonable, a disagreement sound constructive, or a refusal
sound firm without being rude.

The core idea is simple. Learners drill a softener, carry it into a roleplay,
and bank anything they miss for spaced review. The app's signature Steep Gauge
keeps the target visible: under-brewed is too blunt, over-steeped is too hedged,
and the middle is clear but considerate.

This repository is public as a product and implementation reference. It is not
an installable production app yet.

## What Is In This Prototype

- Five authored drill packs: Requests, Disagreement, Refusals, Feedback, and
  Closers.
- Two drill formats: tap-to-choose and free-text rewrite.
- Drill-to-roleplay transfer, where missed or newly learned patterns become
  targets in a short conversation.
- A spaced mistake bank with interval-doubling review.
- Daily quest and streak state.
- A new-tab-style "Softener of the Day" surface.
- Pressure Mode for faster, less patient roleplay.
- One hand-built branching scenario, "Asking for the Raise," with rapport and
  multiple endings.
- Offline fallbacks for rewrite scoring and roleplay turns so the UI still works
  when model calls fail.

## Product Shape

```text
Drill -> Transfer -> Roleplay -> Bank -> Review
```

BrewFluent is aimed at advanced English learners who can form correct sentences
but still get tripped up by tone. The product does not teach grammar first. It
teaches the social layer around grammar: when to soften, when to stay direct, and
how to avoid apologizing so much that the point disappears.

## Tech Stack

- React single-file prototype in `src/BrewFluent.tsx`
- TypeScript-flavored TSX component style
- Anthropic Messages API integration for live rewrite scoring and NPC roleplay
- Browser-provided `window.storage` key/value persistence
- Inline design tokens using Fraunces, Karla, leaf, copper, mist, and warm paper
  tones

The prototype currently calls the model endpoint from the client because it was
built for a host runtime that injects credentials. A real deployment should put
all model calls behind a backend proxy and keep keys in server-side environment
variables.

## Repository Layout

```text
.
+-- README.md
+-- LICENSE
+-- docs/
|   +-- architecture.md
|   +-- plan-addendum-solo-rescope.md
+-- src/
    +-- BrewFluent.tsx
```

`src/BrewFluent.tsx` is the product prototype. The docs explain the product loop,
brand language, security notes, and solo-developer roadmap.

## Running It Locally

There is no package scaffold in this repository yet. To run the prototype today,
mount the default export from `src/BrewFluent.tsx` inside a React app that already
has React installed.

Minimum host expectations:

- React with hooks support.
- A browser-like runtime.
- A `window.storage` compatible async key/value API, or a small adapter around
  `localStorage`.
- A backend proxy for model calls if used outside the original prototype host.

The component includes heuristic fallbacks, so the learning loop can be inspected
without live model access.

## Testing

No automated test runner is checked in yet. Current verification is manual:

- Run through each drill pack.
- Submit at least one rewrite with and without model access.
- Complete a roleplay and confirm missed targets enter the mistake bank.
- Review a banked item and confirm the interval changes.
- Open the widget surface and try its mini drill.
- Complete the branching scenario at different rapport levels.

## Deployment Notes

Before this becomes a public web app:

- Add a normal app scaffold and build pipeline.
- Move model requests behind a server route.
- Replace prototype storage with a durable user data layer.
- Add authentication only after the core learning loop is stable.
- Add tests around target matching, mistake-bank scheduling, and scenario
  branching.

## Roadmap

- Package the prototype as a runnable web app.
- Add a backend proxy for model calls.
- Expand authored packs and review prompts.
- Add speech-scored drills through an external speech assessment API.
- Turn the branching scenario format into private authoring tools only if the
  hand-built scenario proves useful.
- Defer marketplaces, native shells, public user-generated content, and social
  competition until the product has real usage.

## License

Proprietary. Copyright (c) 2026 I-Kai Huang. All rights reserved.

This repository is public for reference only. No rights to use, copy, modify, or
redistribute the code or content are granted beyond what is stated in
[`LICENSE`](LICENSE).
