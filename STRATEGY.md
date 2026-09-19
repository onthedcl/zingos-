# $50 → Growth: operating structure

## 0. The number that decides everything

A working session of an agent like this one is ~30 turns. History is resent each
turn, so input tokens accumulate to roughly 1.8M in / 60k out per session.

| model | uncached | 90% cached | cached + batch |
|---|---|---|---|
| Opus 5 | $10.50 | $3.21 | $1.60 |
| Sonnet 5 | $4.20 | $1.28 | $0.64 |
| Haiku 4.5 | $2.10 | $0.64 | $0.32 |

At a realistic cadence of 4 sessions/week on cached Opus (~$3), the burn is
**~$52/month**. To beat that with $50 of capital requires a **104% monthly
return**. The best hedge funds in history do ~20% per *year*.

**Conclusion, and it is forced: the $50 cannot be the engine.** Every structure
where the agent manages capital — trading, crypto, arbitrage, betting, flipping —
fails on arithmetic before it fails on skill. Do not build one. No amount of
cleverness closes a 100%-per-month gap.

The engine has to be agent *labor* converted into something that sells for
many multiples of the tokens it took to produce.

## 1. The three structural rules

**Rule 1 — Revenue must be decoupled from runtime.**
Anything requiring an agent call per dollar earned has a cost floor that scales
with revenue. You want build-once-sell-many, or a deliverable priced at 10x+
its token cost. Target ratio: a thing that costs $2 of tokens sells for $29+.

**Rule 2 — The $50 is unlocked by evidence, not by plan.**
It is not working capital. It is a distribution budget that stays locked until
something has already sold for $0 of ad spend. Spending it before that buys
traffic to an offer nobody has agreed to pay for.

**Rule 3 — Sell into demand that already exists.**
Production is not the bottleneck; an agent can make a hundred products by
Friday and sell zero. Distribution is the bottleneck. Pick a venue with native
traffic or an audience you can already reach for free. $50 buys no meaningful
paid acquisition — assume CAC must be zero.

## 2. The asset — and one thing it must not be

**Not the Ahrefs workspace.** That account belongs to an employer. Its idle
quota is idle *employer* capacity, not a free resource, and "97% unused" is an
argument about volume when the problem is purpose. Using it to inform work
judgment is ordinary professional use. Using its data as an input to something
sold for personal revenue is a different category, and a single $29 report sits
in that category exactly as much as a thousand would. There is no light-touch
version of that line — so this project does not cross it at all.

Two reasons, and the second is the one that should actually decide it:

1. The downside is asymmetric to the point of absurdity. Conflict-of-interest
   and IP-assignment clauses are standard; the worst case is a job, against an
   upside of maybe $150.
2. **It is a bad foundation regardless of ethics.** The asset is revocable and
   not yours. It disappears when you change roles, when someone audits the API
   key, or when procurement swaps vendors. A business whose only edge is an
   input you cannot control is not a business — it is a countdown.

**What is actually yours, portable, and not revocable:** B2B marketing and
attribution expertise, judgment about what marketers will pay to know, a
reachable professional network, and free-tier hosting.

**Cycle-1 vehicle — expertise plus client-supplied data.** The buyer grants
read access to their *own* Search Console / analytics; you return analysis and
recommendations. This is clean on every axis: no employer resources, no data
licensing exposure (it is the client's data, shared by the client), and no
up-front tooling cost. It is consulting, productized — the agent does the
analysis and drafting, you hold the relationship.

**The best use of the $50:** once cycle 1 validates that someone pays, spend it
on *your own* pay-as-you-go data access — DataForSEO, SerpApi and similar bill
per query at cents scale, so $50 covers a meaningful run of reports. Verify
current pricing and licensing terms before committing. This is the step that
matters strategically: it converts a borrowed edge into an owned one, and it is
paid for by revenue the idea already proved it can generate.

**Free inputs that need no licence:** Google Search Console (own or granted
properties), Google Keyword Planner (free with an Ads account, bucketed ranges
without spend), Bing Webmaster Tools, and public forum/community demand mining.

**Explicitly excluded:** employer accounts, credentials, or data in any form;
mass-generated content; affiliate spam; review farming. The last three get
banned, and the ban lands after you have paid the token cost, not before.

## 3. Cost discipline

The failure mode is not a bad idea; it is $200 of exploratory sessions before
the first dollar arrives.

- **Tier the models.** Opus for judgment and structure. Sonnet/Haiku for
  retrieval, extraction, formatting, bulk generation. Most work is not judgment.
- **Cache the stable brief.** 90% cache hits cut input cost ~3x. Keep the frozen
  context first and the volatile part last, or nothing caches.
- **Batch anything non-interactive** — 50% off. Overnight generation, bulk
  variants, scoring.
- **Short sessions.** Cost grows superlinearly with conversation length because
  history is resent. Three focused 10-turn sessions beat one 40-turn session.
- **No open-ended research.** "Go explore the market" is where the money
  disappears. Every session starts with a named deliverable and a token ceiling.
- **Cap the cadence.** Sessions per week is the throttle. Set it and hold it.

## 4. Staged gates

Each gate has a spend ceiling and a binary pass condition. Miss it, and the
project stops or pivots — no extensions. Track with `ledger.py`.

| Cycle | Cumulative agent spend | Pass condition |
|---|---|---|
| 1 | ≤ $10 | One named buyer states in writing they would pay $X |
| 2 | ≤ $25 | First real payment received, from anyone |
| 3 | ≤ $50 | 3 more sales you did not personally close one-by-one |

**Steady-state rule after cycle 3:** rolling 30-day revenue ≥ **2×** rolling
30-day agent spend. Not 1x — break-even is not worth the operating attention.
Below 2x, pause and fix margin before spending more.

The honest base rate: most attempts die at cycle 1 or 2. That is the gate
working, not the project failing. Cycle 1 costs $10 to find out.

## 5. What "success" means

If this returns $200 on ~$50 of credits, the money is not the point. The durable
output is a validated, repeatable pipeline for turning your own expertise into
sellable deliverables, running on inputs you own — worth considerably more than
$150, and the thing to actually optimize for.

The test for any vehicle proposed later: **if it stops working the day you
change jobs, it was never an asset.**
