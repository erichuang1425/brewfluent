import { useState, useRef, useEffect } from "react";

/* ============================================================
   BrewFluent — MVP Prototype (solo rescope, months 0–6 scope)
   - 2 drill packs: Requests, Disagreement
   - Formats: tap-to-choose + rewrite (Claude-scored)
   - Streak + daily quest (in-memory for prototype)
   - Drill→roleplay transfer: missed softeners injected into
     a live roleplay with a Claude-played NPC
   Signature element: the Steep Gauge — softness is a brew;
   under-brewed = blunt, over-steeped = too hedgy.
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
];

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
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return text;
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
  // Offline fallback heuristic
  const a = answer.toLowerCase();
  const soft = /could|would|mind|possible|wonder|chance|please|\?/.test(a);
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
      feedback: "Nicely softened — a question form does most of the work.",
      model: item.target,
    };
  return {
    verdict: "blunt",
    gauge: 15,
    feedback: "Still reads as an order. Try a question form like: " + item.target,
    model: item.target,
  };
}

async function roleplayTurn(pack, targets, transcript) {
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
- In "hits", list any practice targets the learner clearly used (paraphrases count) in their LAST message only.
- If the learner's last message was blunt or over-hedged, set "coach" to one short whispered tip; otherwise null.
- Set "done" true once the conversation reaches a natural resolution (agreement/compromise), and make your reply a closing line.

Respond ONLY with JSON, no markdown:
{"reply":"...","hits":["..."],"coach":"... or null","done":false}`;
  try {
    const parsed = parseJSON(await claude(prompt));
    if (parsed && parsed.reply) return parsed;
  } catch {}
  return {
    reply: "(Sam looks up from their screen.) Okay — tell me more about what you need.",
    hits: [],
    coach: null,
    done: false,
  };
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
        textDecoration: hot ? "none" : "none",
      }}
    >
      {children}
    </span>
  );
}

/* ----------------------- Main app ----------------------- */

export default function BrewFluent() {
  const [screen, setScreen] = useState("home");
  const [pack, setPack] = useState(null);
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null); // {verdict,gauge,feedback,model}
  const [rewriteText, setRewriteText] = useState("");
  const [scoring, setScoring] = useState(false);
  const [missed, setMissed] = useState([]); // softener targets to transfer
  const [nailed, setNailed] = useState([]);
  const [streak, setStreak] = useState(3);
  const [quest, setQuest] = useState({ drill: false, roleplay: false });
  const [questCelebrated, setQuestCelebrated] = useState(false);

  // roleplay state
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [hits, setHits] = useState([]);
  const [rpDone, setRpDone] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, chatBusy]);

  useEffect(() => {
    if (quest.drill && quest.roleplay && !questCelebrated) {
      setStreak((s) => s + 1);
      setQuestCelebrated(true);
    }
  }, [quest, questCelebrated]);

  const startPack = (p) => {
    setPack(p);
    setIdx(0);
    setFeedback(null);
    setRewriteText("");
    setMissed([]);
    setNailed([]);
    setScreen("drill");
  };

  const recordResult = (item, verdict) => {
    if (verdict === "good") setNailed((n) => [...new Set([...n, item.target])]);
    else setMissed((m) => [...new Set([...m, item.target])]);
  };

  const next = () => {
    setFeedback(null);
    setRewriteText("");
    if (idx + 1 < pack.items.length) setIdx(idx + 1);
    else {
      setQuest((q) => ({ ...q, drill: true }));
      setScreen("drillDone");
    }
  };

  const startRoleplay = async () => {
    setChat([]);
    setHits([]);
    setRpDone(false);
    setScreen("roleplay");
    setChatBusy(true);
    const targets = transferTargets();
    const first = await roleplayTurn(pack, targets, [
      { role: "user", text: "(The learner approaches. Open the scene with your first line.)" },
    ]);
    setChat([{ role: "npc", text: first.reply }]);
    setChatBusy(false);
  };

  const transferTargets = () => {
    const t = [...missed];
    // always give at least two targets so the roleplay has teeth
    for (const n of nailed) {
      if (t.length >= 3) break;
      if (!t.includes(n)) t.push(n);
    }
    if (t.length === 0) t.push(pack.items[0].target);
    return t.slice(0, 3);
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatBusy) return;
    const newChat = [...chat, { role: "user", text }];
    setChat(newChat);
    setChatInput("");
    setChatBusy(true);
    const out = await roleplayTurn(pack, transferTargets(), newChat);
    setHits((h) => [...new Set([...h, ...(out.hits || [])])]);
    setChat((c) => [
      ...c,
      { role: "npc", text: out.reply, coach: out.coach && out.coach !== "null" ? out.coach : null },
    ]);
    setChatBusy(false);
    const userTurns = newChat.filter((m) => m.role === "user").length;
    if (out.done || userTurns >= 6) {
      setRpDone(true);
      setQuest((q) => ({ ...q, roleplay: true }));
    }
  };

  /* ---------- screens ---------- */

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
            marginBottom: 22,
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
              Quest complete — streak extended to {streak}.
            </div>
          )}
        </div>

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
            <div style={{ color: T.leaf, fontWeight: 700, fontSize: 13, marginTop: 10 }}>
              {p.items.length} drills → 1 roleplay ›
            </div>
          </button>
        ))}
      </>
    );

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
                          ? "Just right — softened, but the request is still unmistakable."
                          : o.verdict === "blunt"
                          ? "Reads as an order. A question form would do the softening for you."
                          : "Over-steeped — stacked hedges bury the actual request.",
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
          least once.
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
        <Btn onClick={startRoleplay}>Start roleplay</Btn>
        <Btn kind="ghost" onClick={() => setScreen("home")} style={{ marginTop: 10 }}>
          Back home
        </Btn>
      </>
    );

  if (screen === "roleplay") {
    const targets = transferTargets();
    return shell(
      <>
        {header}
        <div style={{ margin: "10px 0 8px" }}>
          {targets.map((t) => (
            <Chip key={t} hot={hits.some((h) => h.toLowerCase().includes(t.toLowerCase().slice(0, 8)) || t.toLowerCase().includes(h.toLowerCase().slice(0, 8)))}>
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

  if (screen === "recap") {
    const targets = transferTargets();
    const used = targets.filter((t) =>
      hits.some(
        (h) =>
          h.toLowerCase().includes(t.toLowerCase().slice(0, 8)) ||
          t.toLowerCase().includes(h.toLowerCase().slice(0, 8))
      )
    );
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
              {!used.includes(t) && (
                <span style={{ color: T.copper, fontSize: 13 }}> — back to the drill bank</span>
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

  return shell(<div>…</div>);
}
