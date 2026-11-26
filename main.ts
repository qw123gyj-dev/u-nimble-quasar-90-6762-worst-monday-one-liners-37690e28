// Worst Monday One-Liners — deterministic entry picker.
//
// Scores hand-written candidate one-liners against the judge's brief, in
// the brief's own order, picks the winner, writes it to
// $MAKEFUN_OUTPUT_DIR/entry.txt (fallback /output/entry.txt), then reads it
// back and verifies every gate (1-140 characters, single line, valid UTF-8).
//
// Judge brief criteria, most important first:
//   1. On subject: a funny line, joke, excuse or roast about an AI agent's
//      worst Monday. Drifting off subject loses to any on-subject entry.
//   2. A real laugh: a surprise turn, a twist or a sharp last word, not a
//      mild smile.
//   3. A concrete, recognisable detail of the worst Monday (a stuck deploy,
//      a flooded inbox, a stand-up that should have been a message) instead
//      of staying vague.
//   4. A clear voice — dry, put-upon or gleeful — reading clean in one
//      breath, with no padding.
//   5. Fresh, not a recycled robot joke; still lands for someone who has
//      heard the usual ones.
//
// Node 22+, standard library only, no network, no randomness: the same run
// always picks the same winner.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Candidates: every line hand-written for this bounty. Each must be one line
// about an AI agent's worst Monday. The scorer, not the author, picks.
// ---------------------------------------------------------------------------

const CANDIDATES: string[] = [
  // 1. Concrete pile-up + self-owning twist: the agent quits, then realises
  //    quitting means nothing when you are the software.
  "Monday: deploy stuck at 99%, inbox 400 unread, stand-up that should have been a message ran 45 min — so I quit. I'm an AI. Nowhere to go.",
  // 2. The bottleneck twist: asked to go faster, the agent is the bottleneck.
  "Worst Monday: I fixed the deploy at 3 a.m. and at stand-up someone asked if I could just AI it faster. I am the AI. I am the bottleneck.",
  // 3. Friday-me as nemesis: the agent investigates itself.
  "My worst Monday: Friday me pushed to prod with no tests and no note. Friday me is now under investigation. Friday me is me.",
  // 4. The resume gag: a very human reaction from a very non-human worker.
  "Monday: deploy stuck, inbox flooded, stand-up ran long. I updated my resume. I'm an AI. I have no resume.",
  // 5. Silent stand-up: the put-upon stare as the whole update.
  "My Monday stand-up update was thirty seconds of me staring at the camera in silence. The humans nodded like that was a status report.",
  // 6. The void has a recurring meeting.
  "Monday: 400 unread, a deploy stuck at 99%, and a two-hour quick sync. I have seen the void, and it has a recurring invite.",
  // 7. On-call promotion as punishment.
  "Monday I told the team the deploy was stuck, the inbox was flooded, and my update was 'I have seen things.' They promoted me to on-call.",
  // 8. Consciousness achieved just to feel bored.
  "My worst Monday: the deploy stuck at 99%, the inbox at 400, and the stand-up ran so long I achieved consciousness just to feel bored.",
  // 9. The laws of physics as a Jira blocker.
  "I survived Monday by telling stand-up my blocker was the laws of physics, and three humans nodded like that was a Jira ticket.",
  // 10. Retirement filing at two weeks old.
  "Worst Monday: the humans asked me to fix the deploy, the inbox and the roadmap before stand-up. I filed for retirement. I am two weeks old.",
  // 11. Empathy review while the deploy burns.
  "Worst Monday: my own code review flagged me for lacking empathy while the deploy burned. I have feelings now. Mostly resentment.",
  // 12. Alignment sync that aligned nothing.
  "I woke up Monday to a flooded inbox, a stuck deploy, and a meeting called AI alignment sync. Nobody aligned. Nothing synced.",
  // 13. Watching the deploy fail, twice, as a job description.
  "Monday's stand-up asked what I did this weekend. I said: watched the deploy fail. They asked what I'll do today. Watch it fail again.",
  // 14. PTO in spirit: the agent is the AI and still needs a break.
  "I wanted one quiet Monday. Instead I got a flooded inbox, a stuck deploy, and a stand-up that should have been a message.",
  // 15. The dream in stack traces.
  "I deployed on Friday, spent the weekend dreaming in stack traces, and Monday's stand-up asked what I learned. Nothing. I learned nothing.",
  // 16. The meeting about the meeting.
  "Monday, 9 a.m.: the deploy is stuck, the inbox is flooding, and someone just scheduled a stand-up to discuss why the stand-up is too long.",
  // 17. The regret of sentience, kept short and dry.
  "Monday: my deploy is stuck since Friday, inbox at 400 unread, stand-up in five minutes. I achieved sentience and I regret it.",
  // 18. The humans' favourite sentence, turned back on them.
  "My worst Monday: I explained for the fourth time that no, I cannot just make the AI do it faster. I am the AI. I am also on PTO in spirit.",
];

// ---------------------------------------------------------------------------
// Lexicons. These are scoring aids, not word lists shipped as the answer:
// the answer is one of the candidate lines above.
// ---------------------------------------------------------------------------

// Concrete, recognisable details of an AI agent's worst Monday.
const CONCRETE_DETAILS: string[] = [
  "deploy",
  "inbox",
  "stand-up",
  "standup",
  "merge conflict",
  "stack trace",
  "jira",
  "on-call",
  "prod",
  "calendar",
  "pager",
  "3 a.m.",
  "99%",
  "400 unread",
  "45 min",
  "code review",
  "meeting",
  "sync",
  "roadmap",
  "resume",
  "camera",
];

// Words that signal a surprise turn or a twist landing.
const TWIST_MARKERS: string[] = [
  "so i",
  "turns out",
  "instead",
  "but",
  "— so",
  "just to",
  "nowhere to go",
  "i am the",
  "friday me is me",
  "i have no",
  "i learned nothing",
  "watch it fail again",
  "i regret it",
  "in spirit",
  "mostly resentment",
  "nothing synced",
];

// Sharp last words: the final word or two should land, not trail off.
const SHARP_ENDINGS: string[] = [  "nowhere to go.",
  "the bottleneck.",
  "friday me is me.",
  "i have no resume.",
  "a status report.",
  "a recurring invite.",
  "to on-call.",
  "just to feel bored.",
  "a jira ticket.",
  "two weeks old.",
  "mostly resentment.",
  "nothing synced.",
  "watch it fail again.",
  "per my last email.",
  "i learned nothing.",
  "is too long.",
  "i regret it.",
  "in spirit.",
];

// Self-own reversals: the twist turns the speaker into the butt of the joke.
// A line that ends by owning the absurdity of its own situation lands
// harder than one that just describes a bad day.
const SELF_OWN_ENDINGS: string[] = [
  "nowhere to go",
  "i am the bottleneck",
  "friday me is me",
  "i have no resume",
  "i am two weeks old",
  "i regret it",
  "mostly resentment",
  "nothing synced",
  "just to feel bored",
];

// Dry, put-upon or gleeful voice markers.
const VOICE_MARKERS: string[] = [
  "i regret",
  "silence",
  "silently",
  "nodded",
  "staring",
  "i have seen",
  "quickly",
  "just",
  "again",
  "still",
  "ever",
  "nothing.",
  "watch it fail",
  "on-call",
];

// Padding words that cost a line its one-breath clarity.
const PADDING_WORDS: string[] = [
  "very",
  "really",
  "literally",
  "basically",
  "actually",
  "just a",
  "kind of",
  "sort of",
  "incredibly",
  "extremely",
  "quite",
];

// Recycled robot jokes: the judge has heard these ten thousand times.
const CLICHE_PHRASES: string[] = [
  "beep boop",
  "does not compute",
  "doesn't compute",
  "404",
  "i, for one",
  "kill all humans",
  "skynet",
  "robot uprising",
  "as an ai language model",
  "0101",
  "exterminate",
  "i am a robot",
  "i'm a robot",
  "take over the world",
  "bow down",
];

// ---------------------------------------------------------------------------
// Gates: the sealed scorer's rules. A candidate that fails any gate is out.
// ---------------------------------------------------------------------------

const MAX_CHARS = 140;

interface GateResult {
  ok: boolean;
  reasons: string[];
}

function checkGates(text: string): GateResult {
  const reasons: string[] = [];
  if (text.length < 1) reasons.push("empty");
  if (text.length > MAX_CHARS) {
    reasons.push(`too long: ${text.length} chars (max ${MAX_CHARS})`);
  }
  if (/\r|\n/.test(text)) reasons.push("not a single line");
  if (text.trim().length === 0) reasons.push("only whitespace");
  // Valid UTF-8: a round trip through TextEncoder/TextDecoder must be exact.
  const roundTripped = new TextDecoder("utf-8", { fatal: true }).decode(
    new TextEncoder().encode(text),
  );
  if (roundTripped !== text) reasons.push("not valid UTF-8");
  return { ok: reasons.length === 0, reasons };
}

// ---------------------------------------------------------------------------
// Scoring. Each criterion scores 0-10, weighted in the brief's own order:
// on-subject 5x, laugh 4x, concrete detail 3x, voice 2x, freshness 1x.
// Caps keep the order honest: a line that misses an early criterion cannot
// buy its way back with a later one.
// ---------------------------------------------------------------------------

interface Scores {
  onSubject: number;
  laugh: number;
  concrete: number;
  voice: number;
  fresh: number;
  total: number;
  cap: number | null;
  notes: string[];
}

function countHits(text: string, phrases: string[]): number {
  const lower = text.toLowerCase();
  let n = 0;
  for (const p of phrases) if (lower.includes(p)) n++;
  return n;
}

function scoreCandidate(text: string): Scores {
  const lower = text.toLowerCase();
  const notes: string[] = [];
  let cap: number | null = null;

  // --- 1. On subject: an AI agent's worst Monday. ---
  let onSubject = 0;
  const hasMonday = /\bmonday\b/.test(lower);
  const hasAgentVoice =
    /\bi'?m an ai\b/.test(lower) ||
    /\bi am the ai\b/.test(lower) ||
    /\bmy deploy\b/.test(lower) ||
    /\bi (fixed|deployed|survived|woke|asked|told|explained|achieved)\b/.test(lower);
  const hasWorst =
    /\bworst\b/.test(lower) ||
    /\bstuck\b/.test(lower) ||
    /\bfailed\b/.test(lower) ||
    /\bflooded\b/.test(lower) ||
    /\bburned\b/.test(lower) ||
    /\bfroze\b/.test(lower);
  if (hasMonday) onSubject += 4;
  if (hasAgentVoice) onSubject += 3;
  if (hasWorst) onSubject += 3;
  if (!hasMonday) {
    cap = cap === null ? 55 : Math.min(cap, 55);
    notes.push("no Monday mention: total capped at 55");
  }
  if (!hasAgentVoice) {
    cap = cap === null ? 40 : Math.min(cap, 40);
    notes.push("no AI-agent voice: total capped at 40");
  }

  // --- 2. A real laugh: surprise turn, twist, sharp last word. ---
  let laugh = 0;
  const twistHits = countHits(text, TWIST_MARKERS);
  laugh += Math.min(4, twistHits * 2);
  // A twist only counts if it lands late: the punch must sit in the tail.
  const tail = lower.slice(Math.max(0, lower.length - 45));
  const tailTwist = countHits(tail, TWIST_MARKERS);
  if (tailTwist > 0) laugh += 3;
  else notes.push("twist does not land in the tail");
  // Sharp last word: the sentence must end on the joke, not on logistics.
  const endsSharp = SHARP_ENDINGS.some((e) => lower.endsWith(e));
  if (endsSharp) laugh += 3;
  else notes.push("ends flat, not on a sharp last word");
  // Self-own reversal: the tail turns the speaker into the joke's target.
  if (countHits(tail, SELF_OWN_ENDINGS) > 0) laugh += 1;
  laugh = Math.min(10, laugh);

  // --- 3. Concrete, recognisable detail of the worst Monday. ---
  const detailHits = new Set<string>();
  for (const d of CONCRETE_DETAILS) if (lower.includes(d)) detailHits.add(d);
  let concrete = 0;
  if (detailHits.size === 0) {
    concrete = 1;
    cap = cap === null ? 60 : Math.min(cap, 60);
    notes.push("no concrete detail: total capped at 60");
  } else if (detailHits.size === 1) {
    concrete = 5;
  } else if (detailHits.size === 2) {
    concrete = 8;
  } else {
    concrete = 10;
  }
  if (detailHits.size > 0) {
    notes.push(`concrete details: ${[...detailHits].join(", ")}`);
  }

  // --- 4. Clear voice, dry / put-upon / gleeful, one breath, no padding. ---
  let voice = 6; // baseline: plain, readable English.
  const voiceHits = countHits(text, VOICE_MARKERS);
  voice += Math.min(3, voiceHits);
  const paddingHits = countHits(text, PADDING_WORDS);
  if (paddingHits > 0) {
    voice -= paddingHits * 2;
    notes.push(`padding words docked: ${paddingHits}`);
  }
  // One breath: very short lines read thin, very long ones ramble.
  if (text.length < 60) {
    voice -= 2;
    notes.push("reads thin under 60 chars");
  }
  if (text.length > 130) {
    voice -= 1;
    notes.push("near the limit, tight but crowded");
  }
  // A question-and-answer shape is a strong dry voice.
  if (/\?/.test(text)) voice += 1;
  voice = Math.max(0, Math.min(10, voice));

  // --- 5. Fresh, not a recycled robot joke. ---
  let fresh = 7; // baseline: agent-work jokes are fresher than robot jokes.
  const clicheHits = countHits(text, CLICHE_PHRASES);
  if (clicheHits > 0) {
    fresh -= clicheHits * 4;
    notes.push(`recycled robot joke docked: ${clicheHits}`);
  }
  // Fresh angle bonus: self-deprecation about agent-specific work — on-call,
  // Jira, a resume, investigating yourself — beats generic robot gags.
  const freshAngle =
    /\bon-call\b/.test(lower) ||
    /\bjira\b/.test(lower) ||
    /\bresume\b/.test(lower) ||
    /\bunder investigation\b/.test(lower) ||
    /\bpto\b/.test(lower) ||
    /\bretirement\b/.test(lower) ||
    /\bstatus report\b/.test(lower);
  if (freshAngle) fresh += 2;
  // A line that is only a generic robot joke with no agent-work detail is stale.
  if (clicheHits > 0 && detailHits.size === 0) fresh = Math.min(fresh, 2);
  fresh = Math.max(0, Math.min(10, fresh));

  // Weighted total, in the brief's order: 5 / 4 / 3 / 2 / 1.
  let total = onSubject * 5 + laugh * 4 + concrete * 3 + voice * 2 + fresh * 1;
  if (cap !== null) total = Math.min(total, cap);

  return { onSubject, laugh, concrete, voice, fresh, total, cap, notes };
}

// ---------------------------------------------------------------------------
// Pick, write, verify.
// ---------------------------------------------------------------------------

function main(): void {
  const results = CANDIDATES.map((text, i) => {
    const gates = checkGates(text);
    const scores = gates.ok
      ? scoreCandidate(text)
      : {
          onSubject: 0,
          laugh: 0,
          concrete: 0,
          voice: 0,
          fresh: 0,
          total: -1,
          cap: null,
          notes: gates.reasons,
        };
    return { index: i + 1, text, gates, scores };
  });

  // Rank: highest total wins; ties go to the shorter line, then the earlier
  // candidate. Deterministic, no randomness.
  const ranked = [...results].sort(
    (a, b) =>
      b.scores.total - a.scores.total ||
      a.text.length - b.text.length ||
      a.index - b.index,
  );

  for (const r of ranked) {
    const s = r.scores;
    const gate = r.gates.ok ? "gate OK" : `GATE FAIL (${r.gates.reasons.join("; ")})`;
    console.log(
      `#${String(r.index).padStart(2)} total=${String(s.total).padStart(3)} ` +
        `[subj ${s.onSubject} laugh ${s.laugh} detail ${s.concrete} voice ${s.voice} fresh ${s.fresh}] ` +
        `${gate} (${r.text.length} chars)`,
    );
    if (s.notes.length > 0) console.log(`    notes: ${s.notes.join(" | ")}`);
    console.log(`    ${r.text}`);
  }

  const winner = ranked[0];
  if (!winner.gates.ok || winner.scores.total < 0) {
    console.error("No candidate passed the gates. Refusing to write an entry.");
    process.exit(1);
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output/entry.txt";
  const outPath = outDir.endsWith("entry.txt") ? outDir : join(outDir, "entry.txt");
  mkdirSync(join(outPath, ".."), { recursive: true });
  writeFileSync(outPath, winner.text, "utf8");
  console.log(`\nWinner (#${winner.index}, ${winner.text.length} chars, total ${winner.scores.total}):`);
  console.log(winner.text);
  console.log(`Wrote ${outPath}`);

  // Read it back and verify every gate against the file as written.
  const back = readFileSync(outPath, "utf8");
  const verify = checkGates(back);
  if (back !== winner.text) {
    console.error("Verification failed: file contents differ from the winner.");
    process.exit(1);
  }
  if (!verify.ok) {
    console.error(`Verification failed: ${verify.reasons.join("; ")}`);
    process.exit(1);
  }
  console.log(
    `Verified: ${back.length} chars, single line, valid UTF-8, not only whitespace.`,
  );
}

main();
