#!/usr/bin/env python3
"""Cycle ledger for the $50 project.

The gates in STRATEGY.md only work if something enforces them. This does.
Exits non-zero when a kill rule trips, so it can run from a hook or CI.

    ./ledger.py log --cycle 1 --agent-cost 3.20 --note "drafted offer"
    ./ledger.py log --cycle 2 --revenue 49 --note "first sale"
    ./ledger.py status
"""

import argparse, json, sys
from datetime import date, datetime, timedelta
from pathlib import Path

LEDGER = Path(__file__).parent / "ledger.json"

# (cycle, cumulative agent-spend ceiling, pass condition)
GATES = [
    (1, 10.0, "One named buyer states in writing they would pay $X"),
    (2, 25.0, "First real payment received, from anyone"),
    (3, 50.0, "3 more sales not personally closed one-by-one"),
]
STEADY_STATE_MULTIPLE = 2.0
CAPITAL = 50.0


def load():
    if not LEDGER.exists():
        return {"entries": []}
    return json.loads(LEDGER.read_text())


def save(d):
    LEDGER.write_text(json.dumps(d, indent=2) + "\n")


def cmd_log(a):
    d = load()
    d["entries"].append({
        "date": a.date or date.today().isoformat(),
        "cycle": a.cycle,
        "agent_cost": round(a.agent_cost, 2),
        "capital": round(a.capital, 2),
        "revenue": round(a.revenue, 2),
        "note": a.note,
    })
    save(d)
    print(f"logged cycle {a.cycle}: "
          f"agent ${a.agent_cost:.2f} | capital ${a.capital:.2f} | rev ${a.revenue:.2f}")
    return 0


def rolling(entries, field, days=30):
    cutoff = datetime.now().date() - timedelta(days=days)
    return sum(e[field] for e in entries
               if date.fromisoformat(e["date"]) >= cutoff)


def cmd_status(a):
    e = load()["entries"]
    if not e:
        print("No entries yet. Nothing spent, nothing earned.")
        return 0

    agent = sum(x["agent_cost"] for x in e)
    cap = sum(x["capital"] for x in e)
    rev = sum(x["revenue"] for x in e)
    net = rev - agent - cap
    cycle = max(x["cycle"] for x in e)

    print(f"  entries        {len(e)}   (current cycle: {cycle})")
    print(f"  agent spend    ${agent:8.2f}")
    print(f"  capital spent  ${cap:8.2f}  of ${CAPITAL:.2f}  "
          f"(${CAPITAL - cap:.2f} left)")
    print(f"  revenue        ${rev:8.2f}")
    print(f"  net            ${net:8.2f}   <- the only number that matters")

    fail = False

    # Gate ceiling for the current cycle.
    gate = next((g for g in GATES if g[0] == cycle), None)
    if gate:
        _, ceiling, cond = gate
        print(f"\n  gate {cycle}: agent spend ${agent:.2f} / ${ceiling:.2f} ceiling")
        print(f"    pass condition: {cond}")
        if agent > ceiling:
            print(f"    !! BREACHED by ${agent - ceiling:.2f} — "
                  f"stop or pivot, do not extend")
            fail = True
    else:
        # Past the staged gates: steady-state margin rule.
        r30 = rolling(e, "revenue")
        a30 = rolling(e, "agent_cost")
        ratio = (r30 / a30) if a30 else float("inf")
        print(f"\n  steady state (rolling 30d): rev ${r30:.2f} / agent ${a30:.2f} "
              f"= {ratio:.2f}x  (need {STEADY_STATE_MULTIPLE:.0f}x)")
        if a30 and ratio < STEADY_STATE_MULTIPLE:
            print("    !! below margin floor — pause and fix margin")
            fail = True

    if cap > CAPITAL:
        print(f"\n  !! capital overspent by ${cap - CAPITAL:.2f}")
        fail = True

    if fail:
        print("\nVERDICT: STOP")
        return 1
    print("\nVERDICT: CONTINUE")
    return 0


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    lg = sub.add_parser("log", help="record a cycle entry")
    lg.add_argument("--cycle", type=int, required=True)
    lg.add_argument("--agent-cost", type=float, default=0.0,
                    help="Claude credits burned, in dollars")
    lg.add_argument("--capital", type=float, default=0.0,
                    help="drawn from the $50")
    lg.add_argument("--revenue", type=float, default=0.0)
    lg.add_argument("--note", default="")
    lg.add_argument("--date", help="ISO date, defaults to today")
    lg.set_defaults(fn=cmd_log)

    st = sub.add_parser("status", help="totals and gate verdict")
    st.set_defaults(fn=cmd_status)

    a = p.parse_args()
    sys.exit(a.fn(a))


if __name__ == "__main__":
    main()
