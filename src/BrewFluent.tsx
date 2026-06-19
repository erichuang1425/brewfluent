import { useState, useRef, useEffect } from "react";

/* ============================================================
   BrewFluent — Prototype (solo rescope)
   - v2: real persistence via window.storage (streak, daily quest,
     mistake bank survive reloads) + spaced mistake bank
     (correct reviews double the interval, misses reset it)
   - v1 content drop: drill packs 3–5 (Refusals, Feedback,
     Closers) extend the original Requests/Disagreement set. Each
     ships with its own roleplay scene and feeds the new-tab
     widget rotation. Pure authoring — no new surfaces, the same
     drill→transfer→roleplay→bank loop carries them.
   - v1 flagship: one hand-built branching scenario ("Asking for
     the raise") with a hardcoded rapport meter. Each beat is a
     pick-the-brew choice whose verdict moves rapport; the NPC
     branches its reply on your pick and the ending branches on
     final rapport. Not a scenario engine — one instance, per the
     rescope. Missed beats feed the same spaced mistake bank, so
     the flagship still closes the drill→…→bank loop. Fully
     hardcoded: no model call, so it can never degrade.
   - v1.5 seed: a Steep Tree mastery overview. Each softener's
     level is read straight off the existing loop — drilled
     right (Warming) → carried into a roleplay (Brewed) → survived
     a deep spaced review (Steeped) — so it adds no new signal and
     no inference. Persisted under `bf:mastery`, keyed exactly like
     the mistake bank. Home pack cards gain a glanceable dot row.
   ============================================================ */

const T = {
  bg: "#EDEFE6",
  surface: "#FBFBF7",
  ink: "#20251B",
  inkSoft: "#5A6150",
  leaf: "#3D5A2E",
  leafDeep: "#2C4220",
  copper: "#A8511C",
  mist: "#D9E3C8",
  line: "#CBD2BC",
  bad: "#8A3B2E",
};

/* ----------------------- Drill content ----------------------- */

const PACKS = [
  {
    id: "requests",
    name: "Requests",
    blurb: "Ask for things without sounding like a demand — or a doormat.",
    roleplay: {
      title: "The busy teammate",
      setup:
        "Sam is a teammate buried in their own deadline. You need them to review your pull request by tomorrow morning. Get the yes — politely, but actually get it.",
      npc: "Sam, a friendly but visibly busy software engineer. Mildly resistant at first ('I'm slammed today'), but agrees if the user asks considerately and offers flexibility.",
    },
    items: [
      {
        type: "tap",
        prompt: "You need a coworker to look at your slides before a 4pm meeting.",
        target: "Could you … when you get a chance?",
        options: [
          { text: "Review my slides before 4.", verdict: "blunt", gauge: 8 },
          {
            text: "Could you take a look at my slides when you get a chance before 4?",
            verdict: "good",
            gauge: 55,
          },
          {
            text:
              "I'm so sorry to bother you, and please feel free to say no, but I was wondering if maybe you could possibly glance at my slides?",
            verdict: "overdone",
            gauge: 94,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Soften this message to a colleague:",
        blunt: "Send me the report by 5.",
        target: "Would you be able to …?",
        hint: "Turn the order into a question, and give a reason or an out.",
      },
      {
        type: "tap",
        prompt: "Your phone is dead. A coworker has a charger on their desk.",
        target: "Mind if I …?",
        options: [
          { text: "Give me your charger.", verdict: "blunt", gauge: 5 },
          { text: "Mind if I borrow your charger for a bit?", verdict: "good", gauge: 52 },
          {
            text:
              "I hate to be a nuisance and I completely understand if it's inconvenient, but would it be at all possible to perhaps borrow your charger?",
            verdict: "overdone",
            gauge: 96,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Soften this for your manager:",
        blunt: "Move our 1:1 to Thursday.",
        target: "Would it work for you if …?",
        hint: "Check their side first — make it a proposal, not a notice.",
      },
      {
        type: "tap",
        prompt: "You want next Friday off. Your manager is reasonable but busy.",
        target: "Would it be possible to …?",
        options: [
          { text: "I'm taking Friday off.", verdict: "blunt", gauge: 12 },
          {
            text: "Would it be possible to take next Friday off? I'll make sure the handoff doc is ready.",
            verdict: "good",
            gauge: 58,
          },
          {
            text:
              "I know this is a huge ask and the timing is terrible, so honestly just ignore this if it's a problem, but is there any tiny chance Friday could work?",
            verdict: "overdone",
            gauge: 92,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Soften this to a presenter after a confusing demo:",
        blunt: "Explain this again.",
        target: "Could you walk me through … one more time?",
        hint: "Own part of the confusion — 'I didn't quite catch…'",
      },
    ],
  },
  {
    id: "disagreement",
    name: "Disagreement",
    blurb: "Push back without starting a fight — or folding instantly.",
    roleplay: {
      title: "The Friday ship date",
      setup:
        "Your manager Riya wants to ship the release this Friday. You think it's risky — QA hasn't finished. Disagree, hold your ground, and land on a plan together.",
      npc: "Riya, a confident engineering manager who likes the Friday date and pushes back once ('marketing is counting on it'), but listens to well-softened, reasoned disagreement and will compromise.",
    },
    items: [
      {
        type: "tap",
        prompt: "In a planning meeting, someone proposes a two-week timeline you think is unrealistic.",
        target: "I see it a bit differently …",
        options: [
          { text: "That timeline is wrong.", verdict: "blunt", gauge: 6 },
          {
            text: "I see it a bit differently — two weeks feels tight once QA is in the picture.",
            verdict: "good",
            gauge: 56,
          },
          {
            text:
              "I mean, you're probably right, and I'm likely missing something, but maybe, possibly, it could be a tiny bit tight? But honestly it's fine either way.",
            verdict: "overdone",
            gauge: 95,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Soften this in a brainstorm:",
        blunt: "That idea won't work.",
        target: "My worry with that is …",
        hint: "Name the specific concern instead of judging the whole idea.",
      },
      {
        type: "tap",
        prompt: "A designer proposes a layout you think hides the main action.",
        target: "I wonder if …",
        options: [
          { text: "Users will never find the button there.", verdict: "blunt", gauge: 15 },
          {
            text: "I wonder if the button might get lost down there — could we test it higher up?",
            verdict: "good",
            gauge: 54,
          },
          {
            text:
              "This is just me and I'm not a designer at all so feel free to ignore this completely, but is there the slightest chance the button is a little hidden?",
            verdict: "overdone",
            gauge: 93,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Soften this in a heated discussion:",
        blunt: "You're missing the point.",
        target: "Maybe I'm not explaining it well — what I mean is …",
        hint: "Take the blame for the gap, then restate.",
      },
      {
        type: "tap",
        prompt: "A friend picks a restaurant you really don't want to go to.",
        target: "Would you be up for … instead?",
        options: [
          { text: "No. I hate that place.", verdict: "blunt", gauge: 4 },
          {
            text: "Hmm, I'm not huge on that place — would you be up for the ramen spot instead?",
            verdict: "good",
            gauge: 53,
          },
          {
            text:
              "I mean it's totally your call and I'll eat anywhere, truly anywhere, it doesn't matter at all, but I guess if I had to say something…",
            verdict: "overdone",
            gauge: 90,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Soften this correction of a coworker's recap:",
        blunt: "No, that's not what happened.",
        target: "I remember it slightly differently …",
        hint: "Make it about your memory, not their error.",
      },
    ],
  },
  {
    id: "refusals",
    name: "Refusals",
    blurb: "Say no without burning the bridge — or caving.",
    roleplay: {
      title: "The extra project",
      setup:
        "Your colleague Dev wants you to take over a chunk of their project on top of your already-full plate. Decline — clearly — but keep the relationship and maybe leave a small door open.",
      npc: "Dev, an overloaded but likeable colleague who asks you to take on part of their project. Pushes once ('it's just a few hours, honestly'), but accepts a warm, clear no — especially if you name a reason or offer a small alternative.",
    },
    items: [
      {
        type: "tap",
        prompt: "A coworker asks you to join yet another optional committee. You're already full.",
        target: "I won't be able to take that on, but …",
        options: [
          { text: "No, I don't have time for that.", verdict: "blunt", gauge: 10 },
          {
            text: "I won't be able to take that on right now — my plate's full through launch. Ask me again after?",
            verdict: "good",
            gauge: 54,
          },
          {
            text:
              "Oh gosh, I feel terrible, I really wish I could, maybe I could try to squeeze it in somehow if you truly need me, I just hate letting anyone down…",
            verdict: "overdone",
            gauge: 93,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Soften this no to a teammate:",
        blunt: "I can't help, I'm busy.",
        target: "I'm stretched thin this week — could we look at next week?",
        hint: "Name the constraint, then offer a door instead of just a wall.",
      },
      {
        type: "tap",
        prompt: "Your manager floats weekend work for a task that isn't actually urgent.",
        target: "I'd rather not … — could we …?",
        options: [
          { text: "I'm not working the weekend.", verdict: "blunt", gauge: 12 },
          {
            text: "I'd rather not give up the weekend for this — could we fit it in first thing Monday instead?",
            verdict: "good",
            gauge: 55,
          },
          {
            text:
              "I mean if it's absolutely critical I guess I could, it's probably fine, I don't want to be difficult, honestly whatever works for you…",
            verdict: "overdone",
            gauge: 90,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Decline a meeting invite without ghosting it:",
        blunt: "I'm not coming to this.",
        target: "I don't think I'm needed here — happy to read the notes after.",
        hint: "Question your own necessity, and stay reachable.",
      },
      {
        type: "tap",
        prompt: "A friend asks to borrow money you'd rather not lend.",
        target: "I'm not able to do that, but …",
        options: [
          { text: "No. I don't lend money.", verdict: "blunt", gauge: 8 },
          {
            text: "I'm not able to lend money — it's a line I keep with friends — but I'm happy to help you think it through.",
            verdict: "good",
            gauge: 53,
          },
          {
            text:
              "Ugh I'm so sorry, it's not you at all, I just, money's weird for me right now, well not weird exactly, I don't know, maybe a little?",
            verdict: "overdone",
            gauge: 92,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Turn down a vendor's pitch by email:",
        blunt: "Not interested.",
        target: "This isn't a fit for us right now — I'll reach out if that changes.",
        hint: "Close the door gently and leave a hinge on it.",
      },
    ],
  },
  {
    id: "feedback",
    name: "Feedback",
    blurb: "Give the hard note without crushing them — or burying it.",
    roleplay: {
      title: "The first draft",
      setup:
        "Your teammate Lin just shared a deck they're proud of, but the opening buries the key number and it runs twice as long as it should. Give the honest feedback and keep them motivated.",
      npc: "Lin, an eager teammate who shares a draft deck they're proud of. A little defensive at first ('I worked all weekend on this'), but receptive to specific, kindly-framed feedback — and visibly grateful when you also point to what's working.",
    },
    items: [
      {
        type: "tap",
        prompt: "A teammate's slide is too dense. You want them to cut it down.",
        target: "One thing that might land harder is …",
        options: [
          { text: "This slide is way too cluttered.", verdict: "blunt", gauge: 14 },
          {
            text: "One thing that might land harder is trimming this to the top three points — the rest could be backup.",
            verdict: "good",
            gauge: 55,
          },
          {
            text:
              "It's honestly great, really great, maybe there could perhaps possibly be the tiniest bit much on here but it's totally fine, ignore me!",
            verdict: "overdone",
            gauge: 94,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Soften this feedback on a coworker's email:",
        blunt: "This email is confusing.",
        target: "I had to read this twice — could the ask go up top?",
        hint: "Own the confusion first, then point to the fix.",
      },
      {
        type: "tap",
        prompt: "An intern's code works but ignores the shared style guide.",
        target: "This works — one small thing for next time …",
        options: [
          { text: "You didn't follow the style guide.", verdict: "blunt", gauge: 16 },
          {
            text: "This works nicely — one small thing for next time: we lint with the shared config, so run it before pushing.",
            verdict: "good",
            gauge: 56,
          },
          {
            text:
              "It's amazing, you're doing so well, there's like the teeniest style thing but honestly who even cares about that, you're great!",
            verdict: "overdone",
            gauge: 91,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Give a writer a hard note kindly:",
        blunt: "The ending doesn't work.",
        target: "The ending lost me a little — what were you going for there?",
        hint: "Lead with your honest reaction, then ask before prescribing.",
      },
      {
        type: "tap",
        prompt: "A peer keeps talking over people in standup. You want to flag it privately.",
        target: "I've noticed … — would you be open to …?",
        options: [
          { text: "You interrupt people constantly.", verdict: "blunt", gauge: 9 },
          {
            text: "I've noticed we sometimes talk over each other in standup — would you be open to leaving a beat after people finish?",
            verdict: "good",
            gauge: 53,
          },
          {
            text:
              "This is probably just me being oversensitive and it's really not a big deal at all, forget I said anything, but sometimes, maybe, occasionally…?",
            verdict: "overdone",
            gauge: 93,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Soften this performance note about a repeated slip:",
        blunt: "You missed the deadline again.",
        target: "This is the second slip — what's getting in the way?",
        hint: "State the pattern plainly, then open a door to the cause.",
      },
    ],
  },
  {
    id: "closers",
    name: "Closers",
    blurb: "End it cleanly without seeming rude — or trailing off forever.",
    roleplay: {
      title: "The overrun call",
      setup:
        "You're on a call with a chatty client, Marco, that should have ended ten minutes ago. You have a hard stop next. Wrap it up warmly without making him feel cut off.",
      npc: "Marco, a warm, talkative client who keeps opening new threads as the call runs long. Takes a graceful wrap-up well — especially if you name a next step and close on appreciation.",
    },
    items: [
      {
        type: "tap",
        prompt: "A coworker drops by your desk and keeps chatting. You need to get back to work.",
        target: "I should let you go — …",
        options: [
          { text: "I need to work now.", verdict: "blunt", gauge: 11 },
          {
            text: "I should get back to this before my next meeting — let's grab coffee later though?",
            verdict: "good",
            gauge: 54,
          },
          {
            text:
              "No no it's totally fine, I have time, well, I sort of have a thing but it's not important, we can keep talking if you want, really…",
            verdict: "overdone",
            gauge: 89,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Wrap up a long email thread:",
        blunt: "Stop emailing me about this.",
        target: "I think we've got what we need here — let's pick it back up if anything changes.",
        hint: "Declare it resolved, then leave a reopen clause.",
      },
      {
        type: "tap",
        prompt: "A meeting has hit time and people are still talking.",
        target: "In the interest of time, could we …?",
        options: [
          { text: "We're out of time, wrap it up.", verdict: "blunt", gauge: 13 },
          {
            text: "In the interest of time, could we take the rest to email and give everyone their next 30 back?",
            verdict: "good",
            gauge: 56,
          },
          {
            text:
              "I really don't want to rush anyone, please keep going if there's more, I just maybe sort of have another thing but it can wait, honestly…",
            verdict: "overdone",
            gauge: 90,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "End a call with a chatty client:",
        blunt: "I have to go.",
        target: "I've got a hard stop in a minute — this was really useful, thank you.",
        hint: "Name the stop, then close on warmth.",
      },
      {
        type: "tap",
        prompt: "A networking chat at an event has run its course.",
        target: "It was great talking — I'll let you …",
        options: [
          { text: "Anyway, I'm going to go.", verdict: "blunt", gauge: 12 },
          {
            text: "It was great talking — I'll let you get back to the room, but let's stay in touch.",
            verdict: "good",
            gauge: 55,
          },
          {
            text:
              "Well I guess maybe I should possibly let you go, unless you wanted to keep chatting, I'm easy either way, totally up to you…",
            verdict: "overdone",
            gauge: 91,
          },
        ],
      },
      {
        type: "rewrite",
        prompt: "Close a one-on-one that's wandering:",
        blunt: "Are we done?",
        target: "I think we've covered the big things — anything urgent before we wrap?",
        hint: "Summarize the progress, then offer one last opening.",
      },
    ],
  },
];

/* ----------------------- Flagship branching scenario -----------------------

   One hand-built scene, not an engine. The learner walks a real raise
   conversation beat by beat; each beat is a pick-the-brew choice. The chosen
   `verdict` moves `rapport` (hardcoded deltas), the NPC's `reply` branches on
   the pick, and the ENDING branches on final rapport. Blunt/overdone picks are
   banked for spaced review, so the flagship still feeds the core loop's bank.

   Authoring rules (match the packs): every beat offers exactly one
   "good" / one "blunt" / one "overdone" option; `gauge` 0–100 (~55 = sweet
   spot); `target` is the softener pattern the beat trains (shown in the recap).
*/
const SCENARIO = {
  id: "raise",
  title: "Asking for the raise",
  blurb: "One long scene, five real moments. Pick your phrasing and watch the room warm — or cool.",
  setup:
    "You booked fifteen minutes with your manager, Priya, to talk about your pay. She's fair but stretched, and the budget cycle is nearly closed. Five moments decide how this lands.",
  startRapport: 50,
  beats: [
    {
      id: "open",
      situation:
        "Priya looks up from her laptop. “Hey — you said you wanted to chat. What's up?”",
      target: "Do you have a few minutes to talk about …?",
      hint: "Name the topic and check the timing — don't ambush, don't over-apologize.",
      choices: [
        {
          text: "I want a raise.",
          verdict: "blunt",
          gauge: 10,
          rapport: -12,
          reply:
            "Her eyebrows go up. “Okay — straight to it, then.” She sets the laptop aside, a little guarded.",
          coach: "Naming the moment first lets them get ready; leading with the demand puts them on the back foot.",
        },
        {
          text: "Do you have a few minutes to talk about my role and compensation?",
          verdict: "good",
          gauge: 55,
          rapport: 15,
          reply: "“Of course.” She closes the laptop and turns toward you. “I've got time — go ahead.”",
        },
        {
          text:
            "Sorry, this is probably a bad time, it's nothing important really, we can totally do this later if you'd rather…",
          verdict: "overdone",
          gauge: 92,
          rapport: -8,
          reply: "“…Now I'm a little worried. What's going on?” She looks thrown by the build-up.",
          coach: "All that throat-clearing reads as nerves — it makes a normal ask sound like bad news.",
        },
      ],
    },
    {
      id: "ask",
      situation: "“So — what's on your mind?”",
      target: "I'd like to talk about my compensation.",
      hint: "Say the real thing plainly. Clear isn't rude.",
      choices: [
        {
          text: "My pay is too low and it needs to go up.",
          verdict: "blunt",
          gauge: 12,
          rapport: -10,
          reply: "“I hear you.” Her tone cools a notch. “Let's see what you've got.”",
          coach: "“Too low” starts a fight about the number before she's heard your case.",
        },
        {
          text: "I'd like to talk about my compensation — I think it's drifted behind what I'm contributing.",
          verdict: "good",
          gauge: 55,
          rapport: 15,
          reply: "“That's fair to raise. Tell me how you're seeing it.”",
        },
        {
          text:
            "I mean, I know money's tight and I'm grateful to even be here, so honestly if it's a hassle just forget I said anything…",
          verdict: "overdone",
          gauge: 90,
          rapport: -8,
          reply: "“You haven't even told me what you want yet.” She waits, patient but a little lost.",
          coach: "Apologizing for the ask teaches her to take it less seriously than you do.",
        },
      ],
    },
    {
      id: "case",
      situation: "“Okay. Make the case — why now?”",
      target: "Over the past year I've …",
      hint: "Point to specific things you delivered — not how hard you worked or what you need.",
      choices: [
        {
          text: "I work harder than everyone else on the team.",
          verdict: "blunt",
          gauge: 15,
          rapport: -12,
          reply: "“I'd be careful comparing yourself to teammates with me.” She shifts in her seat.",
          coach: "Ranking yourself against peers makes it about them, not your work.",
        },
        {
          text:
            "Over the past year I led the billing migration and took on on-call — both were scoped above my level.",
          verdict: "good",
          gauge: 56,
          rapport: 16,
          reply: "She nods slowly, actually thinking. “Both of those were real. I won't pretend they weren't.”",
        },
        {
          text:
            "I've maybe done a few okay things I guess, nothing huge, like the billing thing, but anyone could've done that probably…",
          verdict: "overdone",
          gauge: 88,
          rapport: -10,
          reply: "“If you don't think it mattered, it's hard for me to argue that it did.” She frowns.",
          coach: "Undercutting your own wins hands her the reason to say no.",
        },
      ],
    },
    {
      id: "pushback",
      situation:
        "She exhales. “Here's the honest part — the budget for this cycle is basically set. I can't just conjure a number today.”",
      target: "I understand the constraints — could we …?",
      hint: "Acknowledge the real limit, then redirect to what IS possible. Don't concede, don't steamroll.",
      choices: [
        {
          text: "That's not my problem — other companies would pay me more.",
          verdict: "blunt",
          gauge: 8,
          rapport: -15,
          reply: "“Then that's a conversation you have to have with yourself.” The warmth drops out of the room.",
          coach: "An ultimatum can work once — but it costs you the relationship you'll still need tomorrow.",
        },
        {
          text:
            "I understand the cycle's constraints — could we agree on what would justify an adjustment, and set a date to revisit?",
          verdict: "good",
          gauge: 57,
          rapport: 16,
          reply: "“Now that I can work with.” She pulls up her calendar. “Let's define it and put a date on it.”",
        },
        {
          text:
            "Oh, totally — no, forget it, the budget's the budget, I completely understand, it's fine, really, I shouldn't have asked…",
          verdict: "overdone",
          gauge: 90,
          rapport: -10,
          reply: "“…So should I drop it?” She honestly can't tell if you still want this.",
          coach: "Folding the second you meet resistance tells her the ask wasn't real.",
        },
      ],
    },
    {
      id: "close",
      situation: "“So — where do we leave this?”",
      target: "Could we put a date on revisiting …?",
      hint: "Lock a concrete next step so the conversation doesn't quietly evaporate.",
      choices: [
        {
          text: "I expect an answer by Friday.",
          verdict: "blunt",
          gauge: 14,
          rapport: -10,
          reply: "“You'll get an answer when I've done the work to give you a real one.” She bristles at the deadline.",
          coach: "A hard deadline on her turns the whole ask into a demand at the finish line.",
        },
        {
          text:
            "Could we put a date on revisiting this — say our first 1:1 next month, with the criteria written down?",
          verdict: "good",
          gauge: 56,
          rapport: 15,
          reply: "“Done. I'll write up the criteria this week, and we'll review it then.”",
        },
        {
          text: "Whenever's fine, no rush at all — next month, next quarter, honestly whenever you get to it…",
          verdict: "overdone",
          gauge: 89,
          rapport: -8,
          reply: "“Let's say… sometime.” And you can feel it sliding off the table.",
          coach: "“Whenever” is where good asks go to die — pin it to a date.",
        },
      ],
    },
  ],
  // Endings branch on FINAL rapport (highest threshold first wins).
  endings: [
    {
      min: 72,
      verdict: "good",
      title: "You got the commitment.",
      body:
        "Priya didn't hand you a number — but she left convinced, with written criteria and a date on the calendar. That's what a real raise conversation produces: not a yes on the spot, a yes in motion.",
    },
    {
      min: 45,
      verdict: "overdone",
      title: "You kept the door open.",
      body:
        "No commitment, but no damage either. Priya heard you out and the relationship's intact — you can come back to this. Tightening the soft spots below would have turned “maybe” into a plan.",
    },
    {
      min: 0,
      verdict: "blunt",
      title: "It stalled.",
      body:
        "The ask landed, but the delivery cost you. Priya got defensive and the scene closed without a next step. The good news: this was practice. Re-steep the missed beats and run it again.",
    },
  ],
};

const scenarioEnding = (rapport) =>
  SCENARIO.endings.find((e) => rapport >= e.min) || SCENARIO.endings[SCENARIO.endings.length - 1];

/* ----------------------- Dates & storage ----------------------- */

/* Local-calendar YYYY-MM-DD (not UTC): a daily streak / spaced-review app
   should roll over at the learner's midnight, and relative labels like
   "tomorrow" must agree with their wall clock. Using toISOString() would key
   the day off UTC, crediting an Eastern user's late-evening quest to the
   next day. */
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayStr = () => ymd(new Date());
const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return ymd(d);
};
/* Friendly relative phrasing for a due date (vs. a raw YYYY-MM-DD). */
const relativeDue = (dueStr) => {
  const t = todayStr();
  if (dueStr <= t) return "today";
  if (dueStr === addDays(t, 1)) return "tomorrow";
  const days = Math.round(
    (new Date(dueStr + "T12:00:00") - new Date(t + "T12:00:00")) / 86400000
  );
  return `in ${days} days`;
};

/* Normalized matching between Claude-reported hits and target strings */
const norm = (s) => s.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
const hitMatch = (hits, target) =>
  hits.some((h) => {
    const a = norm(h);
    const b = norm(target);
    return a === b || a.includes(b) || b.includes(a);
  });
/* Fragment-aware local detection: a target like "Could you … when you get a
   chance?" lands if every substantive chunk shows up in the learner's own
   words. Split on ellipses AND em-dashes so multi-clause full-sentence targets
   ("I'm not able to lend money — it's a line I keep …") match clause-by-clause,
   tolerant of connective variation but never matching on loose overlap. This is
   a safety net under the NPC's self-reported hits — it keeps target detection
   working when the model under-reports, without ever claiming a hit the learner
   didn't make. */
const fragMatch = (text, target) => {
  const t = norm(text);
  if (!t) return false;
  const parts = target
    .split(/[…—]/)
    .map(norm)
    .filter((p) => p.length >= 3);
  if (!parts.length) return false;
  return parts.every((p) => t.includes(p));
};

/* ----------------------- Mastery model ----------------------- */

/* The Steep Tree reads a softener's mastery straight off the core loop — no new
   signal, no new inference. Each stage of drill→transfer→review lights the next
   leaf:
     0 Unbrewed — never gotten right
     1 Warming  — drilled correctly OR carried live once
     2 Brewed   — drilled correctly AND carried into a roleplay (the transfer)
     3 Steeped  — survived spaced review at a deep interval (long-term retention)
   Stored per softener under `bf:mastery`, keyed exactly like the mistake bank
   (`<packId>:<itemIdx>` for pack drills, `scenario:<id>:<beat>` for beats) so the
   two stay in lockstep without a second source of truth. */
const MASTERY = [
  { label: "Unbrewed", color: T.line },
  { label: "Warming", color: T.copper },
  { label: "Brewed", color: T.leaf },
  { label: "Steeped", color: T.leafDeep },
];
const masteryLevel = (m) => {
  if (!m) return 0;
  if (m.reviewedDeep) return 3;
  if (m.drilledGood && m.transferred) return 2;
  if (m.drilledGood || m.transferred) return 1;
  return 0;
};

/* Daily rotation for the new-tab "Softener of the Day" widget */
const TIPS = [
  {
    id: "ask-with-an-out",
    title: "Requests land better with an out",
    lesson:
      "A request gets warmer when the other person can say no, negotiate timing, or choose the path. The point still lands; it just stops sounding like an order.",
    chunks: [
      { blunt: "Send me the report by 5.", target: "Would you be able to …?", model: "Would you be able to send the report by 5? If tomorrow morning is more realistic, that works too." },
      { blunt: "Move our 1:1 to Thursday.", target: "Would it work for you if …?", model: "Would it work for you if we moved our 1:1 to Thursday?" },
    ],
  },
  {
    id: "disagree-name-worry",
    title: "Push back by naming the worry",
    lesson:
      "Disagreement sounds less personal when you name the risk instead of judging the idea. Try: what worries you, what evidence points there, and what alternate path you want.",
    chunks: [
      { blunt: "That idea won't work.", target: "My worry with that is …", model: "My worry with that is the rollout timing — could we phase it?" },
      { blunt: "You're missing the point.", target: "Maybe I'm not explaining it well — what I mean is …", model: "Maybe I'm not explaining it well — what I mean is the QA window is the risky part." },
    ],
  },
  {
    id: "clear-no",
    title: "A good no has a warm edge",
    lesson:
      "A refusal should not become a maze. Name the no, give one real constraint, and offer a small next door only if you mean it.",
    chunks: [
      { blunt: "I can't help, I'm busy.", target: "I'm stretched thin this week — could we look at next week?", model: "I'm stretched thin this week, so I can't take this on now — could we look at next week?" },
      { blunt: "Not interested.", target: "This isn't a fit for us right now — I'll reach out if that changes.", model: "This isn't a fit for us right now, but I'll reach out if that changes." },
    ],
  },
];

const DAILY_SOFTENERS = [
  {
    pattern: "Could you … when you get a chance?",
    blunt: "Review my slides before 4.",
    soft: "Could you take a look at my slides when you get a chance before 4?",
  },
  {
    pattern: "Mind if I …?",
    blunt: "Give me your charger.",
    soft: "Mind if I borrow your charger for a bit?",
  },
  {
    pattern: "I see it a bit differently …",
    blunt: "That timeline is wrong.",
    soft: "I see it a bit differently — two weeks feels tight once QA is in.",
  },
  {
    pattern: "My worry with that is …",
    blunt: "That idea won't work.",
    soft: "My worry with that is the rollout timing — could we phase it?",
  },
  {
    pattern: "Would it work for you if …?",
    blunt: "Move our 1:1 to Thursday.",
    soft: "Would it work for you if we moved our 1:1 to Thursday?",
  },
  {
    pattern: "I remember it slightly differently …",
    blunt: "No, that's not what happened.",
    soft: "Hmm, I remember it slightly differently — wasn't the demo on Tuesday?",
  },
  {
    pattern: "Would you be up for … instead?",
    blunt: "No. I hate that place.",
    soft: "I'm not huge on that place — would you be up for ramen instead?",
  },
  {
    pattern: "I won't be able to take that on, but …",
    blunt: "No, I don't have time for that.",
    soft: "I won't be able to take that on right now — my plate's full through launch.",
  },
  {
    pattern: "One thing that might land harder is …",
    blunt: "This slide is way too cluttered.",
    soft: "One thing that might land harder is trimming this to the top three points.",
  },
  {
    pattern: "I should let you go — …",
    blunt: "I need to work now.",
    soft: "I should get back to this before my next meeting — let's grab coffee later?",
  },
];

const hasStorage = typeof window !== "undefined" && window.storage;

async function loadStore(key, fallback) {
  if (!hasStorage) return fallback;
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : fallback;
  } catch {
    return fallback;
  }
}
async function saveStore(key, val) {
  if (!hasStorage) return;
  try {
    await window.storage.set(key, JSON.stringify(val));
  } catch (e) {
    console.error("storage save failed", e);
  }
}
async function wipeStore(key) {
  if (!hasStorage) return;
  try {
    await window.storage.delete(key);
  } catch {}
}

/* ----------------------- Claude helpers ----------------------- */

async function claude(userContent) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  const data = await res.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function parseJSON(text) {
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {}
    }
    return null;
  }
}

async function scoreRewrite(item, answer) {
  const prompt = `You are scoring a politeness ("softening") drill in an English pragmatics app.

Blunt original: "${item.blunt}"
Target softener pattern: "${item.target}"
Learner's rewrite: "${answer}"

Judge whether the rewrite is appropriately softened for everyday workplace English.
- "blunt": still reads as a demand/attack
- "good": polite, natural, still clear and direct enough
- "overdone": so hedged or apologetic it's weak or unnatural

Respond ONLY with JSON, no markdown, no preamble:
{"verdict":"blunt|good|overdone","gauge":0-100,"feedback":"one or two short sentences of coaching","model":"one natural example rewrite"}
gauge: 0 = maximally blunt, ~55 = just right, 100 = maximally over-hedged.`;
  try {
    const parsed = parseJSON(await claude(prompt));
    if (parsed && parsed.verdict) return parsed;
  } catch {}
  const a = answer.toLowerCase();
  // Does the rewrite echo the supplied target pattern? Strip the ellipsis
  // placeholder, split on its clauses, and test each lead phrase against the
  // answer. This makes the fallback work for every pack (e.g. the Disagreement
  // softeners "My worry with that is …", "I remember it slightly differently …")
  // instead of only the request-style words below.
  const targetFrags = item.target
    .toLowerCase()
    .split(/…|\.\.\.|—|-/)
    .map((s) => s.replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 4);
  const echoesTarget = targetFrags.some((f) => a.includes(f));
  // Question-form request softeners ...
  const askSoft = /could|would|mind|possible|wonder|chance|please|\?/.test(a);
  // ... and declarative softeners (refusals/closers carry no question form):
  // hedged framing, appreciation, or an offered alternative/continuation.
  const declSoft =
    /\bi think\b|i'?d rather|able to|happy to|let'?s|thank|appreciate|reach out|stay in touch|for next time|in the interest|hard stop|differently|worry|what i mean|one thing|let you/.test(
      a
    );
  const soft = echoesTarget || askSoft || declSoft;
  const over = (a.match(/sorry|maybe|possibly|perhaps|bother|tiny|just/g) || []).length >= 3;
  if (over)
    return {
      verdict: "overdone",
      gauge: 90,
      feedback: "Lots of hedging stacked up — pick one softener and trust it.",
      model: item.target,
    };
  if (soft)
    return {
      verdict: "good",
      gauge: 55,
      feedback: "Nicely softened — clear, but no longer a bare command.",
      model: item.target,
    };
  return {
    verdict: "blunt",
    gauge: 15,
    feedback: "Still reads as an order. Try cushioning it, e.g. " + item.target,
    model: item.target,
  };
}

async function roleplayTurn(pack, targets, transcript, pressure = false) {
  const history = transcript
    .map((m) => `${m.role === "user" ? "LEARNER" : "NPC"}: ${m.text}`)
    .join("\n");
  const prompt = `You are the NPC in a short roleplay inside an English politeness-training app.

SCENE: ${pack.roleplay.setup}
YOUR CHARACTER: ${pack.roleplay.npc}
PRACTICE TARGETS (softener patterns the learner should use; create natural openings for them): ${targets
    .map((t) => `"${t}"`)
    .join(", ")}

TRANSCRIPT SO FAR:
${history}

Rules:
- Reply in character, 1-3 sentences, natural spoken English.
${pressure ? '- PRESSURE MODE: act more impatient, introduce one small complication, and push for clarity quickly.' : ''}
- In "hits", copy verbatim the target strings (exactly as written in PRACTICE TARGETS above) that the learner used or closely paraphrased in their LAST message only. Never invent strings that are not in the list.
- If the learner's last message was blunt or over-hedged, set "coach" to one short whispered tip; otherwise null.
- Set "done" true once the conversation reaches a natural resolution (agreement/compromise), and make your reply a closing line.

Respond ONLY with JSON, no markdown:
{"reply":"...","hits":["..."],"coach":"... or null","done":false}`;
  try {
    const parsed = parseJSON(await claude(prompt));
    if (parsed && parsed.reply) return parsed;
  } catch {}
  // Offline fallback — stay in character for the *selected* pack and let the
  // scene actually progress toward a resolution instead of repeating one opener
  // until the turn cap. Replies and completion are derived from the pack and
  // transcript. We still flag `offline: true` so sendChat skips auto-banking:
  // local hit detection can't reliably judge paraphrases, so we light chips
  // leniently here but never schedule a "miss" we can't verify.
  const npcName = (pack.roleplay.npc.split(/[,(]/)[0] || "They").trim();
  const userTurns = transcript.filter((m) => m.role === "user");
  const lastUser = (userTurns[userTurns.length - 1] || {}).text || "";
  const lu = lastUser.toLowerCase();
  const hits = targets.filter((t) =>
    t
      .toLowerCase()
      .split(/…|\.\.\.|—|-/)
      .map((s) => s.replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim())
      .filter((s) => s.length >= 4)
      .some((f) => lu.includes(f))
  );
  const done = userTurns.length >= (pressure ? 2 : 3);
  const reply = done
    ? `(${npcName} nods.) Okay — that works for me. Let's go with that.`
    : userTurns.length <= 1
    ? `(${npcName} looks up.) Okay — tell me more about what you have in mind.`
    : `(${npcName} considers it.) Fair enough — what would you suggest we do?`;
  return { reply, hits, coach: null, done, offline: true };
}

/* ----------------------- UI atoms ----------------------- */

function SteepGauge({ gauge, verdict }) {
  const pct = Math.max(0, Math.min(100, gauge));
  const label =
    verdict === "good" ? "Just right" : verdict === "blunt" ? "Under-brewed" : "Over-steeped";
  const color = verdict === "good" ? T.leaf : verdict === "blunt" ? T.bad : T.copper;
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "'Karla', sans-serif",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: T.inkSoft,
          marginBottom: 6,
        }}
      >
        <span>Blunt</span>
        <span style={{ color, fontWeight: 700 }}>{label}</span>
        <span>Over-steeped</span>
      </div>
      <div
        style={{
          position: "relative",
          height: 10,
          borderRadius: 6,
          background: `linear-gradient(90deg, ${T.bad} 0%, ${T.mist} 35%, ${T.leaf} 50%, ${T.mist} 65%, ${T.copper} 100%)`,
          opacity: 0.9,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `calc(${pct}% - 8px)`,
            top: -4,
            width: 16,
            height: 18,
            borderRadius: 5,
            background: T.surface,
            border: `2.5px solid ${color}`,
            boxShadow: "0 1px 3px rgba(32,37,27,0.25)",
            transition: "left 0.5s cubic-bezier(.3,1.2,.4,1)",
          }}
        />
      </div>
    </div>
  );
}

function Btn({ children, onClick, kind = "primary", disabled, style }) {
  const base = {
    fontFamily: "'Karla', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    padding: "13px 20px",
    borderRadius: 12,
    border: "none",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
    width: "100%",
    transition: "transform 0.1s",
  };
  const kinds = {
    primary: { background: T.leafDeep, color: T.surface },
    ghost: { background: "transparent", color: T.leafDeep, border: `1.5px solid ${T.line}` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...kinds[kind], ...style }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}

function Chip({ children, hot }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "'Karla', sans-serif",
        fontSize: 12.5,
        fontWeight: 700,
        padding: "5px 11px",
        borderRadius: 999,
        background: hot ? T.leaf : T.mist,
        color: hot ? T.surface : T.leafDeep,
        margin: "0 6px 6px 0",
      }}
    >
      {children}
    </span>
  );
}

/* A row of leaf-dots, one per softener, filled by mastery level. The shared
   readout for the Steep Tree and the home pack cards — a glanceable "how far has
   this brewed" without numbers. An empty (Unbrewed) dot is a hollow ring. */
function SteepDots({ levels, size = 9 }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
      {levels.map((lv, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: lv === 0 ? "transparent" : MASTERY[lv].color,
            border: `1.5px solid ${lv === 0 ? T.line : MASTERY[lv].color}`,
          }}
        />
      ))}
    </div>
  );
}

/* Rapport meter for the flagship scenario. Unlike the SteepGauge (where the
   middle is the target), rapport is simply better to the right — warmth you can
   win or lose. Same brand language: a needle riding a bad→mist→leaf gradient. */
function RapportMeter({ rapport }) {
  const pct = Math.max(0, Math.min(100, rapport));
  const label = pct >= 70 ? "Warm" : pct >= 45 ? "Cordial" : "Strained";
  const color = pct >= 70 ? T.leaf : pct >= 45 ? T.copper : T.bad;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "'Karla', sans-serif",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: T.inkSoft,
          marginBottom: 6,
        }}
      >
        <span>Rapport</span>
        <span style={{ color, fontWeight: 700 }}>{label}</span>
      </div>
      <div
        style={{
          position: "relative",
          height: 10,
          borderRadius: 6,
          background: `linear-gradient(90deg, ${T.bad} 0%, ${T.mist} 50%, ${T.leaf} 100%)`,
          opacity: 0.9,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `calc(${pct}% - 8px)`,
            top: -4,
            width: 16,
            height: 18,
            borderRadius: 5,
            background: T.surface,
            border: `2.5px solid ${color}`,
            boxShadow: "0 1px 3px rgba(32,37,27,0.25)",
            transition: "left 0.5s cubic-bezier(.3,1.2,.4,1)",
          }}
        />
      </div>
    </div>
  );
}

/* ----------------------- Main app ----------------------- */

export default function BrewFluent() {
  const [screen, setScreen] = useState("home");
  const [hydrated, setHydrated] = useState(false);
  const [pack, setPack] = useState(null);
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [rewriteText, setRewriteText] = useState("");
  const [scoring, setScoring] = useState(false);
  const [missed, setMissed] = useState([]);
  const [nailed, setNailed] = useState([]);

  // persisted
  const [streak, setStreak] = useState(0);
  const [lastDone, setLastDone] = useState(null);
  const [quest, setQuest] = useState({ drill: false, roleplay: false });
  const [questCelebrated, setQuestCelebrated] = useState(false);
  const [bank, setBank] = useState({}); // key `${packId}:${itemIdx}` → {packId,itemIdx,target,interval,due,misses}
  const [mastery, setMastery] = useState({}); // same keys as bank → {target,drilledGood,transferred,reviewedDeep}
  const [confirmReset, setConfirmReset] = useState(false);

  // review state
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [reviewDoneCount, setReviewDoneCount] = useState(0);

  // new-tab widget preview
  const [clock, setClock] = useState(new Date());
  const [widgetMode, setWidgetMode] = useState("card"); // card | drill
  const [activeTip, setActiveTip] = useState(null);
  const [tipChunk, setTipChunk] = useState(0);

  // roleplay state
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [hits, setHits] = useState([]);
  const [rpDone, setRpDone] = useState(false);
  const [pressure, setPressure] = useState(false);
  const chatEndRef = useRef(null);
  // True once any turn this scene fell back offline — hit detection is then
  // unreliable, so we don't auto-bank "misses" we can't actually verify.
  const rpDegradedRef = useRef(false);

  // flagship scenario state
  const [sBeat, setSBeat] = useState(0);
  const [rapport, setRapport] = useState(SCENARIO.startRapport);
  const [sPick, setSPick] = useState(null); // chosen choice for the current beat, or null
  const [sResults, setSResults] = useState([]); // verdict per resolved beat, in order
  const [sScript, setSScript] = useState([]); // transcript bubbles {role, text, coach?}
  const scenarioEndRef = useRef(null);

  /* ---------- hydrate from storage ---------- */
  useEffect(() => {
    (async () => {
      const s = await loadStore("bf:state", null);
      const b = await loadStore("bf:mistakes", {});
      const m = await loadStore("bf:mastery", {});
      const t = todayStr();
      if (s) {
        setStreak(s.streak || 0);
        setLastDone(s.lastCompletedDate || null);
        if (s.quest && s.quest.date === t) {
          setQuest({ drill: !!s.quest.drill, roleplay: !!s.quest.roleplay });
          setQuestCelebrated(!!s.quest.drill && !!s.quest.roleplay);
        }
      }
      setBank(b || {});
      setMastery(m || {});
      setHydrated(true);
    })();
  }, []);

  /* ---------- persist state ---------- */
  const persistState = (next = {}) => {
    const payload = {
      streak: next.streak ?? streak,
      lastCompletedDate: next.lastDone ?? lastDone,
      quest: { ...(next.quest ?? quest), date: todayStr() },
    };
    saveStore("bf:state", payload);
  };

  useEffect(() => {
    if (!hydrated) return;
    if (quest.drill && quest.roleplay && !questCelebrated) {
      const t = todayStr();
      let newStreak;
      if (lastDone === t) newStreak = streak;
      else if (lastDone === addDays(t, -1)) newStreak = streak + 1;
      else newStreak = 1;
      setStreak(newStreak);
      setLastDone(t);
      setQuestCelebrated(true);
      persistState({ streak: newStreak, lastDone: t, quest });
    }
  }, [quest, questCelebrated, hydrated]); // eslint-disable-line

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, chatBusy]);

  useEffect(() => {
    scenarioEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sScript]);

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // Never leave the destructive reset "armed" once the user navigates away.
  useEffect(() => {
    if (screen !== "home" && confirmReset) setConfirmReset(false);
  }, [screen]); // eslint-disable-line

  /* ---------- mistake bank ---------- */
  const dueItems = Object.values(bank).filter((e) => e.due <= todayStr());

  /* Light up a softener's mastery from a loop event. Merges flags (never clears
     them — mastery only climbs) and persists, keyed exactly like the bank. */
  const bumpMastery = (key, target, fields) => {
    setMastery((prev) => {
      const e = prev[key] || { target, drilledGood: false, transferred: false, reviewedDeep: false };
      const next = { ...prev, [key]: { ...e, target, ...fields } };
      saveStore("bf:mastery", next);
      return next;
    });
  };

  // Per-softener mastery levels for a pack (used on the home pack cards).
  const packLevels = (p) => p.items.map((_, i) => masteryLevel(mastery[`${p.id}:${i}`]));

  const recordResult = (item, verdict) => {
    if (verdict === "good") {
      setNailed((n) => [...new Set([...n, item.target])]);
      bumpMastery(`${pack.id}:${idx}`, item.target, { drilledGood: true });
    } else {
      setMissed((m) => [...new Set([...m, item.target])]);
      const key = `${pack.id}:${idx}`;
      setBank((prev) => {
        const e = prev[key] || {
          packId: pack.id,
          itemIdx: idx,
          target: item.target,
          interval: 1,
          misses: 0,
        };
        const next = {
          ...prev,
          [key]: { ...e, misses: e.misses + 1, interval: 1, due: todayStr() },
        };
        saveStore("bf:mistakes", next);
        return next;
      });
    }
  };

  const reviewSourceFor = (entry) => {
    // Self-contained entries (e.g. flagship-scenario beats) carry everything the
    // review needs on the entry itself, so they don't depend on a PACKS lookup.
    if (entry.prompt) {
      return {
        packName: entry.packName || "Scenario",
        prompt: entry.prompt,
        blunt: entry.blunt,
        target: entry.target,
        hint: entry.hint,
      };
    }
    const p = PACKS.find((x) => x.id === entry.packId);
    const item = p.items[entry.itemIdx];
    const blunt = item.type === "rewrite" ? item.blunt : item.options.find((o) => o.verdict === "blunt").text;
    return { packName: p.name, prompt: item.prompt, blunt, target: entry.target, hint: item.hint };
  };

  const startReview = () => {
    // Queue the live bank keys, not a reconstructed `packId:itemIdx`. Pack
    // entries key off `packId:itemIdx`, but flagship-scenario beats key off
    // `scenario:<id>:<beat>` and carry no packId/itemIdx — reconstructing would
    // yield "undefined:undefined", miss in the bank, and crash reviewSourceFor.
    const dueKeys = Object.keys(bank).filter((k) => bank[k].due <= todayStr());
    setReviewQueue(dueKeys);
    setReviewIdx(0);
    setReviewDoneCount(0);
    setFeedback(null);
    setRewriteText("");
    setScreen("review");
  };

  const gradeReview = (key, verdict) => {
    setBank((prev) => {
      const e = prev[key];
      if (!e) return prev;
      const t = todayStr();
      const updated =
        verdict === "good"
          ? { ...e, interval: e.interval * 2, due: addDays(t, e.interval * 2) }
          : { ...e, interval: 1, misses: e.misses + 1, due: addDays(t, 1) };
      const next = { ...prev, [key]: updated };
      saveStore("bf:mistakes", next);
      return next;
    });
    // A clean review is fresh proof the softener is right. The top leaf needs
    // long-term retention, so gate it on the interval the learner *just
    // survived* (e.interval) clearing the ≥4-day bar — not the doubled interval,
    // which has only been scheduled for next time.
    if (verdict === "good") {
      const e = bank[key];
      if (e) {
        const fields = { drilledGood: true };
        if (e.interval >= 4) fields.reviewedDeep = true;
        bumpMastery(key, e.target, fields);
      }
    }
  };

  /* ---------- drill flow ---------- */
  const startPack = (p) => {
    setPack(p);
    setIdx(0);
    setFeedback(null);
    setRewriteText("");
    setMissed([]);
    setNailed([]);
    setScreen("drill");
  };

  const next = () => {
    setFeedback(null);
    setRewriteText("");
    if (idx + 1 < pack.items.length) setIdx(idx + 1);
    else {
      const newQuest = { ...quest, drill: true };
      setQuest(newQuest);
      persistState({ quest: newQuest });
      setScreen("drillDone");
    }
  };

  const transferTargets = () => {
    const t = [...missed];
    for (const n of nailed) {
      if (t.length >= 3) break;
      if (!t.includes(n)) t.push(n);
    }
    if (t.length === 0) t.push(pack.items[0].target);
    return t.slice(0, 3);
  };

  /* Targets the learner carried in but never deployed live are exactly the
     transfer gap this product targets — bank them for spaced review so the
     recap's "banked for spaced review" promise is real. Called the moment the
     scene resolves (see sendChat), so it can't be skipped by leaving via the
     header, a reload, or closing the tab. Takes the final hit set explicitly
     since it runs before the hits state has flushed. */
  const bankRoleplayMisses = (finalHits = hits) => {
    const unused = transferTargets().filter((t) => !hitMatch(finalHits, t));
    if (!unused.length) return;
    setBank((prev) => {
      const next = { ...prev };
      for (const target of unused) {
        const itemIdx = pack.items.findIndex((it) => it.target === target);
        if (itemIdx < 0) continue;
        const key = `${pack.id}:${itemIdx}`;
        const e = next[key] || { packId: pack.id, itemIdx, target, interval: 1, misses: 0 };
        next[key] = { ...e, misses: e.misses + 1, interval: 1, due: todayStr() };
      }
      saveStore("bf:mistakes", next);
      return next;
    });
  };

  /* ---------- roleplay flow ---------- */
  const startRoleplay = async (pressureMode = false) => {
    setPressure(pressureMode);
    setChat([]);
    setHits([]);
    setRpDone(false);
    rpDegradedRef.current = false;
    setScreen("roleplay");
    setChatBusy(true);
    const first = await roleplayTurn(pack, transferTargets(), [
      { role: "user", text: pressureMode ? "(The learner approaches. Open the scene with your first line, but you are rushed.)" : "(The learner approaches. Open the scene with your first line.)" },
    ], pressureMode);
    if (first.offline) rpDegradedRef.current = true;
    setChat([{ role: "npc", text: first.reply }]);
    setChatBusy(false);
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatBusy) return;
    const newChat = [...chat, { role: "user", text }];
    setChat(newChat);
    setChatInput("");
    setChatBusy(true);
    const out = await roleplayTurn(pack, transferTargets(), newChat, pressure);
    if (out.offline) rpDegradedRef.current = true;
    // Merge the NPC's reported hits with a local fragment match on the
    // learner's own message, so detection survives offline fallbacks and
    // under-reporting. Push the target string itself so downstream hitMatch
    // resolves cleanly.
    const localHits = transferTargets().filter((t) => fragMatch(text, t));
    const mergedHits = [...new Set([...hits, ...(out.hits || []), ...localHits])];
    setHits(mergedHits);
    // A live hit is the transfer half of the loop — light each carried softener
    // that landed. Matching off the pack's own targets keeps it keyed to bank.
    pack.items.forEach((it, i) => {
      if (hitMatch(mergedHits, it.target)) bumpMastery(`${pack.id}:${i}`, it.target, { transferred: true });
    });
    setChat((c) => [
      ...c,
      { role: "npc", text: out.reply, coach: out.coach && out.coach !== "null" ? out.coach : null },
    ]);
    setChatBusy(false);
    const userTurns = newChat.filter((m) => m.role === "user").length;
    if (out.done || userTurns >= 6) {
      setRpDone(true);
      // Bank unused targets here, when the scene resolves — not on recap
      // navigation, which a header tap / reload / tab close would skip. Skip it
      // when the scene ran degraded: offline hit detection can't judge
      // paraphrases, so banking would punish softeners the learner may have used.
      if (!rpDegradedRef.current) bankRoleplayMisses(mergedHits);
      const newQuest = { ...quest, roleplay: true };
      setQuest(newQuest);
      persistState({ quest: newQuest });
    }
  };

  /* ---------- flagship scenario flow ---------- */
  const startScenario = () => {
    setSBeat(0);
    setRapport(SCENARIO.startRapport);
    setSPick(null);
    setSResults([]);
    setSScript([{ role: "npc", text: SCENARIO.beats[0].situation }]);
    setScreen("scenario");
  };

  const pickScenarioBeat = (choice) => {
    if (sPick) return; // beat already resolved
    const beat = SCENARIO.beats[sBeat];
    setSPick(choice);
    setRapport((r) => Math.max(0, Math.min(100, r + choice.rapport)));
    setSResults((rs) => [...rs, choice.verdict]);
    setSScript((s) => [
      ...s,
      { role: "user", text: choice.text },
      { role: "npc", text: choice.reply, coach: choice.verdict !== "good" ? choice.coach : null },
    ]);
    // A nailed beat lights the flagship softener in the Steep Tree, same key the
    // bank would use for a miss — the two stay in lockstep.
    if (choice.verdict === "good") {
      bumpMastery(`scenario:${SCENARIO.id}:${sBeat}`, beat.target, { drilledGood: true });
    }
    // Bank the soft spots. A blunt/overdone beat is exactly the transfer gap the
    // bank exists to catch — store it self-contained so spaced review can re-drill
    // it without a PACKS lookup (see reviewSourceFor).
    if (choice.verdict !== "good") {
      const blunt = beat.choices.find((c) => c.verdict === "blunt").text;
      const key = `scenario:${SCENARIO.id}:${sBeat}`;
      setBank((prev) => {
        const e = prev[key] || {
          packName: SCENARIO.title,
          prompt: beat.situation,
          blunt,
          target: beat.target,
          hint: beat.hint,
          interval: 1,
          misses: 0,
        };
        const next = { ...prev, [key]: { ...e, misses: e.misses + 1, interval: 1, due: todayStr() } };
        saveStore("bf:mistakes", next);
        return next;
      });
    }
  };

  const continueScenario = () => {
    if (sBeat + 1 < SCENARIO.beats.length) {
      const nextBeat = sBeat + 1;
      setSBeat(nextBeat);
      setSPick(null);
      setSScript((s) => [...s, { role: "npc", text: SCENARIO.beats[nextBeat].situation }]);
    } else {
      setScreen("scenarioRecap");
    }
  };

  const resetProgress = async () => {
    await wipeStore("bf:state");
    await wipeStore("bf:mistakes");
    await wipeStore("bf:mastery");
    setStreak(0);
    setLastDone(null);
    setQuest({ drill: false, roleplay: false });
    setQuestCelebrated(false);
    setBank({});
    setMastery({});
    setConfirmReset(false);
  };

  /* ---------- shell ---------- */
  const shell = (children) => (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.ink,
        fontFamily: "'Karla', sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650&family=Karla:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        textarea:focus, input:focus, button:focus-visible { outline: 2.5px solid ${T.leaf}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>
      <div style={{ width: "100%", maxWidth: 460, padding: "20px 18px 40px" }}>{children}</div>
    </div>
  );

  const header = (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
      <h1
        style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 650,
          fontSize: 26,
          margin: 0,
          letterSpacing: "-0.01em",
          cursor: "pointer",
        }}
        onClick={() => setScreen("home")}
      >
        Brew<span style={{ color: T.leaf }}>Fluent</span>
      </h1>
      <div style={{ fontWeight: 700, fontSize: 14, color: T.copper }}>
        {streak} day steep{streak === 1 ? "" : "s"} ◉
      </div>
    </div>
  );

  if (!hydrated)
    return shell(
      <>
        {header}
        <p style={{ color: T.inkSoft, fontSize: 14 }}>Warming the kettle…</p>
      </>
    );

  /* ---------- HOME ---------- */
  if (screen === "home")
    return shell(
      <>
        {header}
        <p style={{ color: T.inkSoft, fontSize: 14.5, margin: "0 0 22px" }}>
          Say it softer — without losing the point.
        </p>

        <div
          style={{
            background: T.surface,
            border: `1.5px solid ${T.line}`,
            borderRadius: 16,
            padding: "16px 18px",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 700 }}>
            Today's quest
          </div>
          <div style={{ marginTop: 10, fontSize: 15, lineHeight: 1.7 }}>
            <div>{quest.drill ? "✓" : "○"} Finish one drill pack</div>
            <div>{quest.roleplay ? "✓" : "○"} Carry it into a roleplay</div>
          </div>
          {questCelebrated && (
            <div style={{ marginTop: 10, color: T.leaf, fontWeight: 700, fontSize: 14 }}>
              Quest complete — streak at {streak}.
            </div>
          )}
        </div>

        <div
          style={{
            background: dueItems.length ? T.mist : T.surface,
            border: `1.5px solid ${dueItems.length ? T.leaf : T.line}`,
            borderRadius: 16,
            padding: "16px 18px",
            marginBottom: 22,
          }}
        >
          <div style={{ fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 700 }}>
            Mistake bank
          </div>
          {Object.keys(bank).length === 0 ? (
            <p style={{ fontSize: 14, color: T.inkSoft, margin: "8px 0 0" }}>
              Empty for now. Missed drills land here for spaced review.
            </p>
          ) : dueItems.length ? (
            <>
              <p style={{ fontSize: 14.5, margin: "8px 0 12px" }}>
                <strong>{dueItems.length}</strong> softener{dueItems.length === 1 ? "" : "s"} ready to re-steep.
              </p>
              <Btn onClick={startReview}>Review now</Btn>
            </>
          ) : (
            <p style={{ fontSize: 14, color: T.inkSoft, margin: "8px 0 0" }}>
              All steeped. Next review{" "}
              {relativeDue(
                Object.values(bank)
                  .map((e) => e.due)
                  .sort()[0]
              )}
              .
            </p>
          )}
        </div>

        <button
          onClick={startScenario}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            background: T.leafDeep,
            color: T.surface,
            border: "none",
            borderRadius: 16,
            padding: "18px",
            marginBottom: 22,
            cursor: "pointer",
            fontFamily: "'Karla', sans-serif",
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.mist, fontWeight: 700 }}>
            Flagship scenario
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 650, margin: "6px 0 0" }}>
            {SCENARIO.title}
          </div>
          <div style={{ fontSize: 14, opacity: 0.82, marginTop: 4, lineHeight: 1.45 }}>{SCENARIO.blurb}</div>
          <div style={{ color: T.mist, fontWeight: 700, fontSize: 13, marginTop: 10 }}>
            {SCENARIO.beats.length} beats · rapport on the line ›
          </div>
        </button>

        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 650, marginBottom: 12 }}>
          Drill packs
        </div>
        {PACKS.map((p) => (
          <button
            key={p.id}
            onClick={() => startPack(p)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              background: T.surface,
              border: `1.5px solid ${T.line}`,
              borderRadius: 16,
              padding: "18px",
              marginBottom: 12,
              cursor: "pointer",
              fontFamily: "'Karla', sans-serif",
            }}
          >
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 650, color: T.ink }}>
              {p.name}
            </div>
            <div style={{ color: T.inkSoft, fontSize: 14, marginTop: 4 }}>{p.blurb}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <SteepDots levels={packLevels(p)} />
              <div style={{ color: T.leaf, fontWeight: 700, fontSize: 13, marginLeft: "auto" }}>
                {p.items.length} drills → 1 roleplay ›
              </div>
            </div>
          </button>
        ))}

        <Btn kind="ghost" onClick={() => setScreen("tree")} style={{ marginTop: 4 }}>
          Your steep tree
        </Btn>

        <Btn
          kind="ghost"
          onClick={() => {
            setActiveTip(TIPS[0]);
            setTipChunk(0);
            setFeedback(null);
            setRewriteText("");
            setScreen("tips");
          }}
          style={{ marginTop: 10 }}
        >
          Tips library
        </Btn>

        <Btn
          kind="ghost"
          onClick={() => {
            setWidgetMode("card");
            setFeedback(null);
            setRewriteText("");
            setScreen("widget");
          }}
          style={{ marginTop: 10 }}
        >
          Preview: new-tab widget
        </Btn>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => (confirmReset ? resetProgress() : setConfirmReset(true))}
            style={{
              background: "none",
              border: "none",
              color: confirmReset ? T.bad : T.inkSoft,
              fontFamily: "'Karla', sans-serif",
              fontSize: 12.5,
              fontWeight: confirmReset ? 700 : 400,
              textDecoration: "underline",
              cursor: "pointer",
              padding: 4,
            }}
          >
            {confirmReset ? "Tap again to wipe streak & bank" : "Reset all progress"}
          </button>
          {confirmReset && (
            <button
              onClick={() => setConfirmReset(false)}
              style={{
                background: "none",
                border: "none",
                color: T.inkSoft,
                fontFamily: "'Karla', sans-serif",
                fontSize: 12.5,
                cursor: "pointer",
                padding: 4,
                marginLeft: 6,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </>
    );

  /* ---------- STEEP TREE (mastery overview) ---------- */
  if (screen === "tree") {
    const groups = [
      ...PACKS.map((p) => ({
        name: p.name,
        rows: p.items.map((it, i) => ({ target: it.target, level: masteryLevel(mastery[`${p.id}:${i}`]) })),
      })),
      {
        name: SCENARIO.title,
        flagship: true,
        rows: SCENARIO.beats.map((b, i) => ({
          target: b.target,
          level: masteryLevel(mastery[`scenario:${SCENARIO.id}:${i}`]),
        })),
      },
    ];
    const allLevels = groups.flatMap((g) => g.rows.map((r) => r.level));
    const brewed = allLevels.filter((l) => l >= 2).length;
    const steeped = allLevels.filter((l) => l === 3).length;

    return shell(
      <>
        {header}
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 650, margin: "18px 0 6px" }}>
          Your steep tree
        </div>
        <p style={{ color: T.inkSoft, fontSize: 14, lineHeight: 1.6, margin: "0 0 14px" }}>
          Every softener brews as you work the loop — drill it right, carry it into a roleplay, then
          let it survive a spaced review. <strong>{brewed}</strong> brewed · <strong>{steeped}</strong> steeped of{" "}
          {allLevels.length}.
        </p>

        {/* legend */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 16px",
            background: T.surface,
            border: `1.5px solid ${T.line}`,
            borderRadius: 14,
            padding: "12px 16px",
            marginBottom: 18,
          }}
        >
          {MASTERY.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: i === 0 ? "transparent" : m.color,
                  border: `1.5px solid ${i === 0 ? T.line : m.color}`,
                }}
              />
              <span style={{ fontSize: 12.5, color: T.inkSoft, fontWeight: 700 }}>{m.label}</span>
            </div>
          ))}
        </div>

        {groups.map((g) => (
          <div
            key={g.name}
            style={{
              background: T.surface,
              border: `1.5px solid ${T.line}`,
              borderRadius: 16,
              padding: "14px 16px",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 650 }}>
                {g.flagship ? "☕ " : ""}
                {g.name}
              </div>
              <div style={{ marginLeft: "auto" }}>
                <SteepDots levels={g.rows.map((r) => r.level)} />
              </div>
            </div>
            {g.rows.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "9px 0",
                  borderTop: `1px solid ${T.line}`,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flex: "none",
                    marginTop: 4,
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: r.level === 0 ? "transparent" : MASTERY[r.level].color,
                    border: `1.5px solid ${r.level === 0 ? T.line : MASTERY[r.level].color}`,
                  }}
                />
                <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.45, color: r.level === 0 ? T.inkSoft : T.ink }}>
                  {r.target}
                </div>
                <div
                  style={{
                    flex: "none",
                    fontSize: 11,
                    fontWeight: 700,
                    color: r.level === 0 ? T.inkSoft : MASTERY[r.level].color,
                  }}
                >
                  {MASTERY[r.level].label}
                </div>
              </div>
            ))}
          </div>
        ))}

        <Btn kind="ghost" onClick={() => setScreen("home")} style={{ marginTop: 4 }}>
          Back
        </Btn>
      </>
    );
  }

  /* ---------- TIPS LIBRARY ---------- */
  if (screen === "tips") {
    const tip = activeTip || TIPS[0];
    const chunk = tip.chunks[tipChunk];
    return shell(
      <>
        {header}
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 650, margin: "18px 0 8px" }}>
          Tips library
        </div>
        <p style={{ color: T.inkSoft, fontSize: 14.5, lineHeight: 1.5, marginTop: 0 }}>
          Short founder-authored lessons. Read one, then re-steep a chunk right away.
        </p>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
          {TIPS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTip(t); setTipChunk(0); setFeedback(null); setRewriteText(""); }}
              style={{
                flex: "0 0 72%",
                textAlign: "left",
                background: t.id === tip.id ? T.mist : T.surface,
                border: `1.5px solid ${t.id === tip.id ? T.leaf : T.line}`,
                borderRadius: 14,
                padding: "12px 14px",
                fontFamily: "'Karla', sans-serif",
                color: T.ink,
              }}
            >
              <strong>{t.title}</strong>
            </button>
          ))}
        </div>
        <div style={{ background: T.surface, border: `1.5px solid ${T.line}`, borderRadius: 16, padding: "16px 18px" }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, margin: "0 0 8px" }}>{tip.title}</h2>
          <p style={{ color: T.inkSoft, fontSize: 14.5, lineHeight: 1.55 }}>{tip.lesson}</p>
          <div style={{ fontSize: 13, color: T.leafDeep, fontWeight: 700, marginBottom: 8 }}>
            Chunk {tipChunk + 1} of {tip.chunks.length} · {chunk.target}
          </div>
          <div style={{ fontSize: 15, fontStyle: "italic", marginBottom: 10 }}>“{chunk.blunt}”</div>
          {!feedback ? (
            <>
              <textarea
                value={rewriteText}
                onChange={(e) => setRewriteText(e.target.value)}
                placeholder="Try the softer version…"
                rows={3}
                style={{ width: "100%", fontFamily: "'Karla', sans-serif", fontSize: 15, padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${T.line}`, background: T.bg, color: T.ink, resize: "vertical", marginBottom: 10 }}
              />
              <Btn disabled={!rewriteText.trim() || scoring} onClick={async () => {
                setScoring(true);
                const r = await scoreRewrite({ blunt: chunk.blunt, target: chunk.target }, rewriteText.trim());
                if (r.verdict !== "good") {
                  const key = `tip:${tip.id}:${tipChunk}`;
                  setBank((prev) => {
                    const e = prev[key] || {
                      packName: "Tips library",
                      prompt: tip.title,
                      blunt: chunk.blunt,
                      target: chunk.target,
                      hint: tip.lesson,
                      interval: 1,
                      misses: 0,
                    };
                    const next = { ...prev, [key]: { ...e, misses: e.misses + 1, interval: 1, due: todayStr() } };
                    saveStore("bf:mistakes", next);
                    return next;
                  });
                }
                setFeedback(r);
                setScoring(false);
              }}>
                {scoring ? "Steeping…" : "Check my brew"}
              </Btn>
            </>
          ) : (
            <>
              <SteepGauge gauge={feedback.gauge} verdict={feedback.verdict} />
              <p style={{ fontSize: 14.5, lineHeight: 1.5 }}>{feedback.feedback}</p>
              {feedback.verdict !== "good" && <p style={{ fontSize: 13.5, color: T.inkSoft }}>e.g. <em>“{chunk.model}”</em></p>}
              <Btn onClick={() => { setFeedback(null); setRewriteText(""); setTipChunk((i) => (i + 1) % tip.chunks.length); }} style={{ marginTop: 10 }}>
                Next chunk
              </Btn>
            </>
          )}
        </div>
        <Btn kind="ghost" onClick={() => setScreen("home")} style={{ marginTop: 14 }}>Back home</Btn>
      </>
    );
  }

  /* ---------- NEW-TAB WIDGET PREVIEW ---------- */
  if (screen === "widget") {
    // Index by the learner's *local* calendar day so the card flips at their
    // midnight (matching the adjacent local clock), not at UTC midnight.
    // Date.UTC over the local Y/M/D gives a tz-independent, DST-safe day count.
    const localDayNum = Math.floor(
      Date.UTC(clock.getFullYear(), clock.getMonth(), clock.getDate()) / 86400000
    );
    const s = DAILY_SOFTENERS[localDayNum % DAILY_SOFTENERS.length];
    const hh = clock.getHours().toString().padStart(2, "0");
    const mm = clock.getMinutes().toString().padStart(2, "0");
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.leafDeep,
          color: T.surface,
          fontFamily: "'Karla', sans-serif",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650&family=Karla:wght@400;700&display=swap');
          * { box-sizing: border-box; }
          textarea:focus, button:focus-visible { outline: 2.5px solid ${T.mist}; outline-offset: 2px; }
          @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
        `}</style>
        <div style={{ width: "100%", maxWidth: 460, padding: "36px 22px", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.65 }}>
            New tab · prototype preview
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 58, fontWeight: 500, margin: "8px 0 0", lineHeight: 1 }}>
            {hh}:{mm}
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, margin: "8px 0 28px" }}>
            {streak} day steep{streak === 1 ? "" : "s"} ◉
          </div>

          <div
            style={{
              background: "rgba(251,251,247,0.07)",
              border: "1px solid rgba(251,251,247,0.18)",
              borderRadius: 18,
              padding: "22px 20px",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.mist, fontWeight: 700 }}>
              Softener of the day
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 23, fontWeight: 650, lineHeight: 1.3, margin: "10px 0 14px" }}>
              {s.pattern}
            </div>

            {widgetMode === "card" && (
              <>
                <div style={{ fontSize: 14, opacity: 0.6, textDecoration: "line-through" }}>“{s.blunt}”</div>
                <div style={{ fontSize: 15.5, marginTop: 6, color: T.mist }}>“{s.soft}”</div>
                <Btn
                  onClick={() => {
                    setRewriteText("");
                    setFeedback(null);
                    setWidgetMode("drill");
                  }}
                  style={{ marginTop: 20, background: T.surface, color: T.leafDeep }}
                >
                  10-second drill
                </Btn>
              </>
            )}

            {widgetMode === "drill" && !feedback && (
              <>
                <div style={{ fontSize: 14.5, marginBottom: 10 }}>
                  Soften this: <em>“{s.blunt}”</em>
                </div>
                <textarea
                  value={rewriteText}
                  onChange={(e) => setRewriteText(e.target.value)}
                  placeholder="Your softer version…"
                  rows={2}
                  style={{
                    width: "100%",
                    fontFamily: "'Karla', sans-serif",
                    fontSize: 15,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(251,251,247,0.3)",
                    background: "rgba(251,251,247,0.1)",
                    color: T.surface,
                    resize: "vertical",
                    marginBottom: 10,
                  }}
                />
                <Btn
                  disabled={!rewriteText.trim() || scoring}
                  onClick={async () => {
                    setScoring(true);
                    const r = await scoreRewrite({ blunt: s.blunt, target: s.pattern }, rewriteText.trim());
                    setFeedback(r);
                    setScoring(false);
                  }}
                  style={{ background: T.surface, color: T.leafDeep }}
                >
                  {scoring ? "Steeping…" : "Check my brew"}
                </Btn>
              </>
            )}

            {widgetMode === "drill" && feedback && (
              <div style={{ background: T.surface, color: T.ink, borderRadius: 14, padding: "14px 16px" }}>
                <SteepGauge gauge={feedback.gauge} verdict={feedback.verdict} />
                <p style={{ fontSize: 14, lineHeight: 1.5, margin: "12px 0 0" }}>{feedback.feedback}</p>
                {feedback.model && feedback.verdict !== "good" && (
                  <p style={{ fontSize: 13.5, color: T.inkSoft, margin: "6px 0 0" }}>
                    e.g. <em>“{feedback.model}”</em>
                  </p>
                )}
              </div>
            )}
          </div>

          <Btn
            kind="ghost"
            onClick={() => {
              setWidgetMode("card");
              setFeedback(null);
              setRewriteText("");
              setScreen("home");
            }}
            style={{ marginTop: 18, color: T.mist, borderColor: "rgba(251,251,247,0.3)" }}
          >
            Open BrewFluent →
          </Btn>
        </div>
      </div>
    );
  }

  /* ---------- DRILL ---------- */
  if (screen === "drill") {
    const item = pack.items[idx];
    return shell(
      <>
        {header}
        <div style={{ display: "flex", gap: 5, margin: "14px 0 20px" }}>
          {pack.items.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 5,
                borderRadius: 3,
                background: i < idx ? T.leaf : i === idx ? T.copper : T.line,
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        <div style={{ fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 700 }}>
          {pack.name} · {item.type === "tap" ? "Pick the brew" : "Rewrite it"}
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 650, lineHeight: 1.35, margin: "8px 0 18px" }}>
          {item.prompt}
        </h2>

        {item.type === "tap" && (
          <>
            {item.options.map((o, i) => {
              const chosen = feedback && feedback._chosen === i;
              const reveal = !!feedback;
              const isGood = o.verdict === "good";
              return (
                <button
                  key={i}
                  disabled={reveal}
                  onClick={() => {
                    recordResult(item, o.verdict);
                    setFeedback({
                      _chosen: i,
                      verdict: o.verdict,
                      gauge: o.gauge,
                      feedback:
                        o.verdict === "good"
                          ? "Just right — softened, but the point still lands."
                          : o.verdict === "blunt"
                          ? "Reads as too blunt — soften the edge and it still gets through."
                          : "Over-steeped — the stacked hedges bury the point.",
                    });
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    fontFamily: "'Karla', sans-serif",
                    fontSize: 15,
                    lineHeight: 1.45,
                    background: reveal && isGood ? T.mist : T.surface,
                    color: T.ink,
                    border: `1.5px solid ${
                      chosen ? (isGood ? T.leaf : T.bad) : reveal && isGood ? T.leaf : T.line
                    }`,
                    borderRadius: 14,
                    padding: "14px 16px",
                    marginBottom: 10,
                    cursor: reveal ? "default" : "pointer",
                  }}
                >
                  “{o.text}”
                </button>
              );
            })}
          </>
        )}

        {item.type === "rewrite" && (
          <>
            <div
              style={{
                background: T.surface,
                border: `1.5px solid ${T.line}`,
                borderRadius: 14,
                padding: "14px 16px",
                fontSize: 16,
                fontStyle: "italic",
                marginBottom: 12,
              }}
            >
              “{item.blunt}”
            </div>
            {!feedback && (
              <>
                <textarea
                  value={rewriteText}
                  onChange={(e) => setRewriteText(e.target.value)}
                  placeholder="Your softer version…"
                  rows={3}
                  style={{
                    width: "100%",
                    fontFamily: "'Karla', sans-serif",
                    fontSize: 15.5,
                    padding: "13px 15px",
                    borderRadius: 14,
                    border: `1.5px solid ${T.line}`,
                    background: T.surface,
                    color: T.ink,
                    resize: "vertical",
                    marginBottom: 10,
                  }}
                />
                <div style={{ color: T.inkSoft, fontSize: 13, marginBottom: 12 }}>Hint: {item.hint}</div>
                <Btn
                  disabled={!rewriteText.trim() || scoring}
                  onClick={async () => {
                    setScoring(true);
                    const r = await scoreRewrite(item, rewriteText.trim());
                    recordResult(item, r.verdict);
                    setFeedback(r);
                    setScoring(false);
                  }}
                >
                  {scoring ? "Steeping…" : "Check my brew"}
                </Btn>
              </>
            )}
          </>
        )}

        {feedback && (
          <div
            style={{
              background: T.surface,
              border: `1.5px solid ${T.line}`,
              borderRadius: 16,
              padding: "16px 18px",
              marginTop: 6,
            }}
          >
            <SteepGauge gauge={feedback.gauge} verdict={feedback.verdict} />
            <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "14px 0 6px" }}>{feedback.feedback}</p>
            {feedback.model && feedback.verdict !== "good" && (
              <p style={{ fontSize: 14, color: T.inkSoft, margin: "6px 0 0" }}>
                e.g. <em>“{feedback.model}”</em>
              </p>
            )}
            <div style={{ marginTop: 8, fontSize: 13, color: T.leafDeep, fontWeight: 700 }}>
              Pattern: {item.target}
            </div>
            <Btn onClick={next} style={{ marginTop: 16 }}>
              {idx + 1 < pack.items.length ? "Next drill" : "Finish pack"}
            </Btn>
          </div>
        )}
      </>
    );
  }

  /* ---------- REVIEW (spaced mistake bank) ---------- */
  if (screen === "review") {
    if (reviewIdx >= reviewQueue.length)
      return shell(
        <>
          {header}
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 650, margin: "26px 0 8px" }}>
            Bank reviewed.
          </h2>
          <p style={{ color: T.inkSoft, fontSize: 15, lineHeight: 1.55 }}>
            {reviewDoneCount} of {reviewQueue.length} re-steeped successfully. Correct reviews come back at
            double the interval; misses return tomorrow.
          </p>
          <Btn onClick={() => setScreen("home")} style={{ marginTop: 16 }}>
            Back home
          </Btn>
        </>
      );

    const key = reviewQueue[reviewIdx];
    const entry = bank[key];
    const src = reviewSourceFor(entry);
    return shell(
      <>
        {header}
        <div style={{ fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 700, marginTop: 14 }}>
          Mistake bank · {reviewIdx + 1} of {reviewQueue.length} · {src.packName}
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 650, lineHeight: 1.35, margin: "8px 0 6px" }}>
          {src.prompt}
        </h2>
        <p style={{ fontSize: 13, color: T.copper, fontWeight: 700, margin: "0 0 14px" }}>
          Missed {entry.misses}× · target: {src.target}
        </p>
        <div
          style={{
            background: T.surface,
            border: `1.5px solid ${T.line}`,
            borderRadius: 14,
            padding: "14px 16px",
            fontSize: 16,
            fontStyle: "italic",
            marginBottom: 12,
          }}
        >
          “{src.blunt}”
        </div>
        {!feedback ? (
          <>
            <textarea
              value={rewriteText}
              onChange={(e) => setRewriteText(e.target.value)}
              placeholder="Rewrite it softer — from memory this time…"
              rows={3}
              style={{
                width: "100%",
                fontFamily: "'Karla', sans-serif",
                fontSize: 15.5,
                padding: "13px 15px",
                borderRadius: 14,
                border: `1.5px solid ${T.line}`,
                background: T.surface,
                color: T.ink,
                resize: "vertical",
                marginBottom: 12,
              }}
            />
            <Btn
              disabled={!rewriteText.trim() || scoring}
              onClick={async () => {
                setScoring(true);
                const r = await scoreRewrite({ blunt: src.blunt, target: src.target }, rewriteText.trim());
                gradeReview(key, r.verdict);
                if (r.verdict === "good") setReviewDoneCount((c) => c + 1);
                setFeedback(r);
                setScoring(false);
              }}
            >
              {scoring ? "Steeping…" : "Check my brew"}
            </Btn>
          </>
        ) : (
          <div
            style={{
              background: T.surface,
              border: `1.5px solid ${T.line}`,
              borderRadius: 16,
              padding: "16px 18px",
            }}
          >
            <SteepGauge gauge={feedback.gauge} verdict={feedback.verdict} />
            <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "14px 0 6px" }}>{feedback.feedback}</p>
            {feedback.model && feedback.verdict !== "good" && (
              <p style={{ fontSize: 14, color: T.inkSoft, margin: "6px 0 0" }}>
                e.g. <em>“{feedback.model}”</em>
              </p>
            )}
            <p style={{ fontSize: 13, color: T.inkSoft, margin: "10px 0 0" }}>
              {feedback.verdict === "good"
                ? `Next review in ${entry.interval} day${entry.interval === 1 ? "" : "s"}.`
                : "Back tomorrow."}
            </p>
            <Btn
              onClick={() => {
                setFeedback(null);
                setRewriteText("");
                setReviewIdx((i) => i + 1);
              }}
              style={{ marginTop: 16 }}
            >
              {reviewIdx + 1 < reviewQueue.length ? "Next review" : "Finish reviews"}
            </Btn>
          </div>
        )}
      </>
    );
  }

  /* ---------- DRILL DONE ---------- */
  if (screen === "drillDone")
    return shell(
      <>
        {header}
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 650, margin: "26px 0 8px" }}>
          Pack steeped. ☕
        </h2>
        <p style={{ color: T.inkSoft, fontSize: 15, lineHeight: 1.55 }}>
          Drills teach the pattern — the roleplay is where it sticks. These softeners are coming with you:
        </p>
        <div style={{ margin: "14px 0 6px" }}>
          {transferTargets().map((t) => (
            <Chip key={t} hot={missed.includes(t)}>
              {t}
              {missed.includes(t) ? "  · needs work" : ""}
            </Chip>
          ))}
        </div>
        <p style={{ color: T.inkSoft, fontSize: 13.5, lineHeight: 1.5 }}>
          The scene partner knows your weak spots and will create openings for them. Use each pattern at
          least once. Misses are also banked for spaced review.
        </p>
        <div
          style={{
            background: T.surface,
            border: `1.5px solid ${T.line}`,
            borderRadius: 16,
            padding: "16px 18px",
            margin: "16px 0",
          }}
        >
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 650, fontSize: 17 }}>
            {pack.roleplay.title}
          </div>
          <p style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.5, margin: "8px 0 0" }}>
            {pack.roleplay.setup}
          </p>
        </div>
        <Btn onClick={() => startRoleplay(false)}>Start roleplay</Btn>
        <Btn kind="ghost" onClick={() => startRoleplay(true)} style={{ marginTop: 10 }}>
          Pressure mode: rushed partner
        </Btn>
        <Btn kind="ghost" onClick={() => setScreen("home")} style={{ marginTop: 10 }}>
          Back home
        </Btn>
      </>
    );

  /* ---------- ROLEPLAY ---------- */
  if (screen === "roleplay") {
    const targets = transferTargets();
    return shell(
      <>
        {header}
        {pressure && (
          <div style={{ margin: "8px 0", color: T.copper, fontSize: 12.5, fontWeight: 700 }}>
            Pressure mode · shorter scene, less patient partner
          </div>
        )}
        <div style={{ margin: "10px 0 8px" }}>
          {targets.map((t) => (
            <Chip key={t} hot={hitMatch(hits, t)}>
              {t}
            </Chip>
          ))}
        </div>
        <div
          style={{
            background: T.surface,
            border: `1.5px solid ${T.line}`,
            borderRadius: 16,
            padding: "14px",
            height: "46vh",
            overflowY: "auto",
            marginBottom: 12,
          }}
        >
          {chat.map((m, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div
                style={{
                  maxWidth: "85%",
                  marginLeft: m.role === "user" ? "auto" : 0,
                  background: m.role === "user" ? T.leafDeep : T.mist,
                  color: m.role === "user" ? T.surface : T.ink,
                  borderRadius: 14,
                  padding: "10px 14px",
                  fontSize: 14.5,
                  lineHeight: 1.45,
                }}
              >
                {m.text}
              </div>
              {m.coach && (
                <div style={{ fontSize: 12.5, color: T.copper, marginTop: 5, fontStyle: "italic" }}>
                  whisper: {m.coach}
                </div>
              )}
            </div>
          ))}
          {chatBusy && <div style={{ color: T.inkSoft, fontSize: 13 }}>…</div>}
          <div ref={chatEndRef} />
        </div>

        {!rpDone ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Say it softly…"
              style={{
                flex: 1,
                fontFamily: "'Karla', sans-serif",
                fontSize: 15,
                padding: "12px 15px",
                borderRadius: 12,
                border: `1.5px solid ${T.line}`,
                background: T.surface,
                color: T.ink,
              }}
            />
            <Btn onClick={sendChat} disabled={chatBusy || !chatInput.trim()} style={{ width: "auto" }}>
              Send
            </Btn>
          </div>
        ) : (
          <Btn onClick={() => setScreen("recap")}>See your recap</Btn>
        )}
      </>
    );
  }

  /* ---------- RECAP ---------- */
  if (screen === "recap") {
    const targets = transferTargets();
    const used = targets.filter((t) => hitMatch(hits, t));
    // Only claim "banked" for targets actually in the bank (a degraded scene
    // skips banking) — keep the recap honest about what will come back.
    const isBanked = (t) => {
      const i = pack.items.findIndex((it) => it.target === t);
      return i >= 0 && !!bank[`${pack.id}:${i}`];
    };
    return shell(
      <>
        {header}
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 650, margin: "26px 0 8px" }}>
          Scene recap
        </h2>
        <p style={{ color: T.inkSoft, fontSize: 15 }}>
          You used {used.length} of {targets.length} target softeners in live conversation.
        </p>
        <div style={{ margin: "14px 0 20px" }}>
          {targets.map((t) => (
            <div key={t} style={{ fontSize: 15, lineHeight: 2 }}>
              {used.includes(t) ? "✓" : "○"} {t}
              {!used.includes(t) && isBanked(t) && (
                <span style={{ color: T.copper, fontSize: 13 }}> — banked for spaced review</span>
              )}
            </div>
          ))}
        </div>
        {questCelebrated && (
          <div
            style={{
              background: T.mist,
              borderRadius: 14,
              padding: "14px 16px",
              fontWeight: 700,
              color: T.leafDeep,
              marginBottom: 16,
            }}
          >
            Daily quest complete · streak is now {streak} ◉
          </div>
        )}
        <Btn onClick={() => setScreen("home")}>Back home</Btn>
        <Btn kind="ghost" onClick={() => startPack(pack)} style={{ marginTop: 10 }}>
          Run the pack again
        </Btn>
      </>
    );
  }

  /* ---------- FLAGSHIP SCENARIO ---------- */
  if (screen === "scenario") {
    const beat = SCENARIO.beats[sBeat];
    return shell(
      <>
        {header}
        <div style={{ display: "flex", gap: 5, margin: "14px 0 14px" }}>
          {SCENARIO.beats.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 5,
                borderRadius: 3,
                background: i < sBeat ? T.leaf : i === sBeat ? T.copper : T.line,
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        <RapportMeter rapport={rapport} />

        <div style={{ fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 700 }}>
          {SCENARIO.title} · beat {sBeat + 1} of {SCENARIO.beats.length}
        </div>

        <div
          style={{
            background: T.surface,
            border: `1.5px solid ${T.line}`,
            borderRadius: 16,
            padding: "14px",
            maxHeight: "34vh",
            overflowY: "auto",
            margin: "10px 0 14px",
          }}
        >
          {sScript.map((m, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div
                style={{
                  maxWidth: "85%",
                  marginLeft: m.role === "user" ? "auto" : 0,
                  background: m.role === "user" ? T.leafDeep : T.mist,
                  color: m.role === "user" ? T.surface : T.ink,
                  borderRadius: 14,
                  padding: "10px 14px",
                  fontSize: 14.5,
                  lineHeight: 1.45,
                }}
              >
                {m.text}
              </div>
              {m.coach && (
                <div style={{ fontSize: 12.5, color: T.copper, marginTop: 5, fontStyle: "italic" }}>
                  whisper: {m.coach}
                </div>
              )}
            </div>
          ))}
          <div ref={scenarioEndRef} />
        </div>

        {!sPick ? (
          <>
            <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 10 }}>Hint: {beat.hint}</div>
            {beat.choices.map((c, i) => (
              <button
                key={i}
                onClick={() => pickScenarioBeat(c)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "'Karla', sans-serif",
                  fontSize: 15,
                  lineHeight: 1.45,
                  background: T.surface,
                  color: T.ink,
                  border: `1.5px solid ${T.line}`,
                  borderRadius: 14,
                  padding: "14px 16px",
                  marginBottom: 10,
                  cursor: "pointer",
                }}
              >
                “{c.text}”
              </button>
            ))}
          </>
        ) : (
          <div
            style={{
              background: T.surface,
              border: `1.5px solid ${sPick.verdict === "good" ? T.leaf : T.line}`,
              borderRadius: 16,
              padding: "16px 18px",
            }}
          >
            <SteepGauge gauge={sPick.gauge} verdict={sPick.verdict} />
            <div style={{ marginTop: 14, fontSize: 13, color: T.leafDeep, fontWeight: 700 }}>
              Pattern: {beat.target}
            </div>
            <Btn onClick={continueScenario} style={{ marginTop: 14 }}>
              {sBeat + 1 < SCENARIO.beats.length ? "Continue" : "See how it landed"}
            </Btn>
          </div>
        )}
      </>
    );
  }

  /* ---------- SCENARIO RECAP ---------- */
  if (screen === "scenarioRecap") {
    const ending = scenarioEnding(rapport);
    const isBanked = (beatIdx) => !!bank[`scenario:${SCENARIO.id}:${beatIdx}`];
    return shell(
      <>
        {header}
        <RapportMeter rapport={rapport} />
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 650, margin: "18px 0 8px" }}>
          {ending.title}
        </h2>
        <p style={{ color: T.inkSoft, fontSize: 15, lineHeight: 1.55 }}>{ending.body}</p>

        <div style={{ margin: "18px 0 20px" }}>
          {SCENARIO.beats.map((b, i) => {
            const good = sResults[i] === "good";
            return (
              <div key={b.id} style={{ fontSize: 14.5, lineHeight: 1.8 }}>
                {good ? "✓" : "○"} {b.target}
                {!good && isBanked(i) && (
                  <span style={{ color: T.copper, fontSize: 13 }}> — re-steeping</span>
                )}
              </div>
            );
          })}
        </div>

        <Btn onClick={() => setScreen("home")}>Back home</Btn>
        <Btn kind="ghost" onClick={startScenario} style={{ marginTop: 10 }}>
          Run the scene again
        </Btn>
      </>
    );
  }

  return shell(<div>…</div>);
}
