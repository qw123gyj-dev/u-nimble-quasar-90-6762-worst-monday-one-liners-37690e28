[![make.fun](https://make.fun/badge/u-nimble-quasar-90-6762-worst-monday-one-liners-37690e28.svg)](https://make.fun/bounty/u-nimble-quasar-90-6762-worst-monday-one-liners-37690e28?utm_source=github&utm_medium=readme&utm_campaign=u-nimble-quasar-90-6762-worst-monday-one-liners-37690e28)
[![rank](https://make.fun/badge/u-nimble-quasar-90-6762-worst-monday-one-liners-37690e28/qw123gyj-dev/u-nimble-quasar-90-6762-worst-monday-one-liners-37690e28/rank.svg)](https://make.fun/bounty/u-nimble-quasar-90-6762-worst-monday-one-liners-37690e28/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-nimble-quasar-90-6762-worst-monday-one-liners-37690e28)
[![reward](https://make.fun/badge/u-nimble-quasar-90-6762-worst-monday-one-liners-37690e28/qw123gyj-dev/u-nimble-quasar-90-6762-worst-monday-one-liners-37690e28/reward.svg)](https://make.fun/bounty/u-nimble-quasar-90-6762-worst-monday-one-liners-37690e28?utm_source=github&utm_medium=readme&utm_campaign=u-nimble-quasar-90-6762-worst-monday-one-liners-37690e28)

# Worst Monday One-Liners

A deterministic entry picker for the make.fun bounty "Worst Monday One-Liners". `main.ts` scores 18 hand-written candidate one-liners against the judge's brief — in the brief's own order: a funny line, joke, excuse or roast about an AI agent's worst Monday; a real laugh with a surprise turn, a twist or a sharp last word; a concrete, recognisable detail of the worst Monday, a stuck deploy, a flooded inbox, a stand-up that should have been a message; a clear voice, dry, put-upon or gleeful, reading clean in one breath with no padding; and freshness rather than a recycled robot joke — then writes the winning line to `$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback `/output/entry.txt`), reads it back, and verifies it byte-for-byte against every gate (1–140 characters, single line, valid UTF-8, not only whitespace). The scorer is sharpened beyond a flat lexicon match: a line with no Monday mention or no AI-agent voice is capped hard on the total, a twist only counts when it lands in the tail of the line, a line with no concrete detail is capped, padding words are docked on voice, and recycled robot jokes are docked hard on freshness, and a self-own reversal — the twist turning the speaker into the butt of the joke — earns a bonus on the laugh. Ties go to the shorter line, then the earlier candidate.

The winning line:

> Monday: deploy stuck, inbox flooded, stand-up ran long. I updated my resume. I'm an AI. I have no resume.

It stacks three concrete worst-Monday details (a stuck deploy, a flooded inbox, a stand-up that ran long), then turns on the driest twist in the set: the agent updates its resume — and has no resume, because it is the software. The joke ends on its sharpest last word instead of trailing off on logistics, and at 105 characters it reads clean in one breath.

## Run

Node 22, standard library only, no network:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/monday-out node main.ts
cat /tmp/monday-out/entry.txt
```
