# zingos

Turning $50 into more than it costs to run the agent.

The constraint is arithmetic, not ambition: at ~4 agent sessions/week, credits
burn ~$52/month, so $50 of capital would need a **104% monthly return** to keep
up. Nothing returns that. So the capital is not the engine — agent labor sold at
a multiple of its token cost is.

Two hard boundaries:

- **No employer resources.** No work accounts, credentials, API quota or data,
  in any form. Borrowed edges are revocable; if it stops working the day you
  change jobs, it was never an asset.
- **The $50 stays locked** until something has sold with $0 of ad spend. Then it
  buys *your own* data access, not traffic.

Files:

- **[STRATEGY.md](STRATEGY.md)** — the math, the three structural rules, the
  vehicle, cost discipline, and the staged kill criteria.
- **[ledger.py](ledger.py)** — enforces the gates. Exits non-zero on a breach.

```
./ledger.py log --cycle 1 --agent-cost 3.20 --note "drafted offer"
./ledger.py status
```
