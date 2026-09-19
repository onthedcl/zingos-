#!/usr/bin/env python3
"""Flip calculator — what you actually keep, not what it looks like you keep.

Most flip maths is wrong in two ways. It forgets the fees, and it prices every
item as if it definitely sells. Some fraction never sell, and those losses come
out of the winners. This prices both.

    python3 flip/flip.py check  --buy 12 --sell 45 --ship 6
    python3 flip/flip.py maxbid --sell 45 --ship 6 --want 15
    python3 flip/flip.py plan   --bankroll 50
"""
from __future__ import annotations
import argparse, sys

# Typical US marketplace costs. CHECK CURRENT RATES — these move.
FEE_PCT   = 0.1325   # final value fee, most categories
FEE_FIXED = 0.40     # per order
DUD_RATE  = 0.25     # share of items that never sell (be honest: it's not 0)

money = lambda v: f"${v:,.2f}"


def net_profit(buy, sell, ship, fee_pct=FEE_PCT, fee_fixed=FEE_FIXED):
    """What lands in your pocket on an item that DOES sell."""
    fees = sell * fee_pct + fee_fixed
    return sell - fees - ship - buy, fees


def cmd_check(a):
    profit, fees = net_profit(a.buy, a.sell, a.ship)
    margin = profit / a.sell if a.sell else 0
    ret = profit / a.buy if a.buy else 0
    print(f"  sells for      {money(a.sell)}")
    print(f"  fees          -{money(fees)}")
    print(f"  shipping      -{money(a.ship)}")
    print(f"  you paid      -{money(a.buy)}")
    print(f"  {'-'*30}")
    print(f"  you keep       {money(profit)}   ({margin:.0%} of sale price)")
    print(f"  return on cost {ret:+.0%}")

    # Same item, priced across a batch where some never sell.
    ev = profit * (1 - a.dud) - a.buy * a.dud
    print(f"\n  across a batch where {a.dud:.0%} never sell:")
    print(f"  average per item {money(ev)}", end="  ")
    print("<- this is the real number" if ev > 0 else "<- LOSES money on average")

    if profit < 0:
        print("\n  VERDICT: don't. It loses money even if it sells.")
    elif ev <= 0:
        print("\n  VERDICT: don't. The duds eat the winners.")
    elif ret < 0.5:
        print("\n  VERDICT: thin. Fine if it sells fast, not worth hunting for.")
    else:
        print("\n  VERDICT: worth doing.")
    return 0


def cmd_maxbid(a):
    """Work backwards: the most you can pay and still clear your target."""
    fees = a.sell * FEE_PCT + FEE_FIXED
    cap = a.sell - fees - a.ship - a.want
    print(f"  to clear {money(a.want)} on a {money(a.sell)} sale:")
    print(f"  fees {money(fees)} + shipping {money(a.ship)}")
    print(f"\n  DO NOT PAY MORE THAN {money(cap)}")
    if cap <= 0:
        print("  (which is impossible — the sale price is too low to work)")
    else:
        print(f"  walk away above that. Every dollar over comes straight off your profit.")
    return 0


def cmd_plan(a):
    """What $X of bankroll realistically does, given you can only hold a few items."""
    bank, price = a.bankroll, a.item_cost
    slots = int(bank // price)
    print(f"  bankroll {money(bank)} at {money(price)}/item = {slots} items at a time\n")
    if slots < 1:
        print("  Can't buy even one item at that price."); return 1

    profit, _ = net_profit(price, a.sell, a.ship)
    ev = profit * (1 - a.dud) - price * a.dud

    print(f"  each item that sells nets {money(profit)}")
    print(f"  average per item after duds {money(ev)}")
    print(f"  per full cycle ({slots} items) {money(ev*slots)}")
    print(f"  at {a.cycles_per_month} cycles/month -> {money(ev*slots*a.cycles_per_month)}/month\n")

    if ev <= 0:
        print("  This does not make money. Change the numbers, not the effort.")
        return 1

    bal, month = bank, 0
    while bal < bank*2 and month < 36:
        month += 1
        s = int(bal // price)
        bal += ev * s * a.cycles_per_month
    print(f"  doubles your money in ~{month} month(s)"
          if month < 36 else "  takes over 3 years to double")
    print(f"\n  Reality check: {slots} items means one bad buy is "
          f"{1/slots:.0%} of your stock. Early on you are learning, not earning.")
    return 0


def main():
    p = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    s = p.add_subparsers(dest="cmd", required=True)

    c = s.add_parser("check", help="is this specific flip worth it?")
    c.add_argument("--buy", type=float, required=True, help="what you'd pay")
    c.add_argument("--sell", type=float, required=True, help="what it sells for")
    c.add_argument("--ship", type=float, default=0.0)
    c.add_argument("--dud", type=float, default=DUD_RATE)
    c.set_defaults(fn=cmd_check)

    m = s.add_parser("maxbid", help="most you can pay and still profit")
    m.add_argument("--sell", type=float, required=True)
    m.add_argument("--ship", type=float, default=0.0)
    m.add_argument("--want", type=float, default=15.0, help="profit you want")
    m.set_defaults(fn=cmd_maxbid)

    pl = s.add_parser("plan", help="what your bankroll realistically does")
    pl.add_argument("--bankroll", type=float, default=50.0)
    pl.add_argument("--item-cost", type=float, default=15.0)
    pl.add_argument("--sell", type=float, default=45.0)
    pl.add_argument("--ship", type=float, default=6.0)
    pl.add_argument("--dud", type=float, default=DUD_RATE)
    pl.add_argument("--cycles-per-month", type=float, default=1.5)
    pl.set_defaults(fn=cmd_plan)

    a = p.parse_args(); sys.exit(a.fn(a))


if __name__ == "__main__":
    main()
