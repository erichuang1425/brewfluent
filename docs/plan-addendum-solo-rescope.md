# BrewFluent — Plan Addendum (Rev. B): Solo-Developer Rescope

This revision supersedes the phasing in the original addendum. The feature vision (Softener Drills, Date-Sim Scenario Engine, Creator Reels, Ambient Widgets, Register Rewriter) is unchanged; the **sequencing, scope, and cost structure are rebuilt for a one-person team** with an extended timeline and minimal upfront spend. Deferred items are explicitly preserved as scale-later tracks, not cut.

**Operating principles**

1. **One codebase, zero native code until traction.** PWA-only. Native shells, app-store presence, widgets, and keyboard hosting all move post-revenue.
1. **Ship loops, not platforms.** Every "engine," "studio," "marketplace," or "creator program" is replaced at launch by one hand-built instance of the thing it would generate.
1. **No ops a solo dev can't carry.** Anything requiring commissioning, payouts, contracts, or moderation pipelines is deferred.
1. **Inference only on explicit action.** No always-on or ambient AI cost; cap free-tier session length.

-----

## C1. Softener Drills — rescoped

**Was:** MVP ships 3 packs + streaks; v1 ships full skill tree, speech-scored drills, leagues.

**Now:**

- **MVP (months 0–6):** 2 drill packs (Requests, Disagreement) in tap-to-choose and rewrite formats only. Streaks and daily quest. The drill→roleplay transfer mechanic ships at MVP — it's the pedagogical core and is cheap (it's flagging + prompt injection, not new infrastructure).
- **v1 (months 7–14):** packs 3–5 (Refusals, Feedback, Closers). Mistake-bank reviews via the existing spaced scheduler.
- **v1.5 (months 15–22):** speech-scored drills using an off-the-shelf speech-assessment API (no in-house scoring model). Full skill tree UI.
- **Deferred to post-traction:** leagues (social infrastructure + anti-cheat isn't solo-viable, and leagues without a user base are empty rooms).

**Cost note:** drill content is the highest-leverage solo work — it's authoring, not engineering. Front-load it.

## C2. Date-Sim Scenario Engine — engine deferred, scenario kept

**Was:** v1 ships the generalized branching/rapport engine + Scenario Studio; v2 ships the marketplace.

**Now:**

- **v1:** **one** flagship branching scenario, hand-authored, with hardcoded rapport logic (a simple state machine, not a generalized engine). Linear scenarios remain the volume content. The post-scene route map ships for this one scenario only — it's the feature's proof of pedagogy.
- **v1.5:** if the flagship scenario shows strong replay/completion metrics, generalize into a minimal Scenario Pack format (versioned JSON) and a bare-bones private Scenario Studio (form-based, AI-assisted branch generation; **no sharing, no library**). Private-only means no moderation pipeline is needed.
- **Deferred to post-traction:** public marketplace, ratings, verified-creator program, revenue share, AI-screening moderation pipeline. All of these are operations, not features.

**Rationale:** the original plan's risk #4 (scope creep at v1) is doubled for a solo dev. One deeply built scenario validates the mechanic at ~10% of the engineering cost.

## C3. Creator Reels — replaced by a self-authored tips library

**Was:** curated/commissioned feed of 10–20 vetted creators at v1; open platform at v2.

**Now:**

- **v1:** a static, self-authored **tips library** — short written/audio micro-lessons covering the same ground ("3 questions that make recruiters remember you," etc.), each with attached chunk cards feeding the Watch → Bank → Practice loop. The *loop* is the product insight; the creator feed was the expensive delivery vehicle.
- **Deferred to post-traction/funding:** commissioned creators, video feed, creator analytics, revenue share. Creator ops (contracts, payouts, vetting, content liability) are a hire, not a sprint.
- **Acquisition substitute:** the solo equivalent of the creator flywheel is founder-led content — you cross-post your own tips clips with deep links. Same funnel shape, zero payout overhead.

## C4. Supporting features — rescoped

- **Pressure Mode:** **kept at v1.** Timers, topic shifts, and an impatient NPC are prompt-and-UI work — cheap, differentiating, solo-friendly.
- **Duet Mode, Wingman, Weekly Boss:** **deferred to post-traction.** All three need either real-time multiplayer infrastructure, calendar/push integration (native), or a community large enough to make a leaderboard meaningful.

-----

## W1. Ambient Widget Layer — new-tab only; native widgets deferred

**Was:** native shells planned at v1.5 specifically to host widgets and push.

**Now:**

- **v1:** **browser new-tab takeover only** ("Softener of the Day" on every new tab). It's the cheapest ambient surface, needs no native code, no app-store review, and validates whether ambient micro-exposure actually drives retention before any native investment.
- **Deferred to post-traction:** Capacitor shells, iOS/Android lock/home widgets, StandBy, watch complications, desktop widget boards, push notifications. The format-decision revision in the original addendum (native shells at v1.5) is **rolled back**: shells return to "build when revenue funds them."

**This is the single biggest cost/timeline lever in the rescope.** Native shells add a second and third build/release pipeline, app-store fees and review cycles, and ongoing OS-version maintenance — the original plan's risk #5 (native-shell maintenance burden) lands entirely on one person.

## W2. Register Rewriter — unchanged (far future), gated harder

Remains the v3 "Everywhere Layer." Additional solo-era gate: do not begin even the browser-extension beta until (a) the learner model and chunk bank are proven in-app, and (b) there is revenue or funding to cover SOC 2 and privacy engineering. The privacy obligations (no keystroke logs, on-device/ephemeral processing, allowlists) are non-negotiable and not solo-shortcut-able.

-----

## Revised phase map (solo edition)

|Feature                        |MVP (mo. 0–6)                                         |v1 (mo. 7–14)                            |v1.5 (mo. 15–22)                                 |Post-traction / funding                         |
|-------------------------------|------------------------------------------------------|-----------------------------------------|-------------------------------------------------|------------------------------------------------|
|Softener Drills                |2 packs, tap/rewrite, streaks, drill→roleplay transfer|Packs 3–5, mistake-bank                  |Speech-scored (API), full skill tree             |Leagues                                         |
|Branching scenarios            |—                                                     |1 flagship, hardcoded rapport + route map|Pack format + private Studio (if metrics warrant)|Marketplace, moderation, rev-share              |
|Tips library (Reels substitute)|—                                                     |Self-authored library + chunk cards      |Audio versions                                   |Creator video feed, analytics, payouts          |
|Pressure Mode                  |—                                                     |✅                                        |—                                                |—                                               |
|Ambient surfaces               |—                                                     |New-tab takeover                         |—                                                |Native shells → iOS/Android widgets → full suite|
|Duet / Wingman / Weekly Boss   |—                                                     |—                                        |—                                                |✅                                               |
|Register Rewriter              |—                                                     |—                                        |—                                                |Browser ext. beta → overlay → keyboard (v3)     |

## Cost structure — what this rescope removes from the launch budget

- **Native development & maintenance:** no second/third codebase, no app-store fees, no review-cycle delays, no OS-version churn.
- **Creator operations:** no commissions, contracts, payouts, vetting, or content-liability exposure.
- **Moderation pipeline:** private-only packs mean no AI-screening infrastructure, report flows, or badge tiering.
- **Speech infrastructure:** deferred, then bought (API) rather than built.
- **Always-on inference:** none; all model calls are user-initiated. Free tier session-capped.

**Largest remaining recurring cost:** LLM API usage in roleplays. Mitigations: session caps on free tier, smaller model for drills/classification, full model only for live roleplay turns.

## Risk register — delta

Original risks #1 (UGC quality) and #3 (creator liability) are **eliminated at launch** by deferral. Risk #5 (native-shell maintenance) is eliminated until post-traction. Risks #2 (gamification crowding out depth) and #4 (v1 scope creep) remain and are tightened: mastery still requires roleplay transfer, and the branching engine is capped at one scenario.

**New solo-specific risks:**

1. **Bus factor / burnout** → ruthless scope discipline (this doc), buy-don't-build for speech and auth, document as you go.
1. **Content authoring bottleneck** (drill packs + tips library are all founder-authored) → use AI-assisted drafting with manual review; budget authoring time explicitly in each phase.
1. **Slower traction window** (22 months to v1.5) → the new-tab widget and founder-led content carry acquisition until the creator flywheel exists.
