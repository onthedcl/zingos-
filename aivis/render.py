"""HTML report renderer.

Color decision: this is ONE series (the subject brand) plus recessive context
(competitors), not a multi-slot categorical palette. Every bar is directly
labeled with its brand name, so color carries no identity load -- it is pure
emphasis. The shipped categorical slot is blue #2a78d6 / #3987e5, which passes
all six checks in both modes; competitors use a neutral that is deliberately
recessive, the same role gridlines play.
"""

from __future__ import annotations

import datetime as _dt
import html


def _bars(rows: list[dict], key: str, fmt) -> str:
    """Horizontal bars: <=24px thick, 4px rounded data-end, square at baseline."""
    if not rows:
        return "<p class='empty'>No data.</p>"
    LBL, W, RH, BH = 168, 700, 34, 22
    plot = W - LBL - 56
    # Clean tick ceiling. Every step divides into 4 clean parts (5/10/15/20/25%);
    # max-scaled axes give ticks like 19%/38%/58%.
    raw = max((r[key] or 0) for r in rows)
    top = next((c for c in (.2, .4, .6, .8, 1.0) if raw <= c + 1e-9), 1.0)
    h = RH * len(rows) + 28

    out = [f'<svg class="chart" viewBox="0 0 {W} {h}" role="img" '
           f'aria-label="Appearance by brand">']
    # Recessive hairline gridlines at 0/25/50/75/100% of scale.
    for f in (0, .25, .5, .75, 1):
        x = LBL + plot * f
        out.append(f'<line class="grid" x1="{x:.1f}" y1="6" x2="{x:.1f}" y2="{h-22}"/>')
        out.append(f'<text class="tick" x="{x:.1f}" y="{h-8}" text-anchor="middle">'
                   f'{fmt(top*f)}</text>')

    for i, r in enumerate(rows):
        y = 6 + i * RH
        bw = max(2.0, plot * ((r[key] or 0) / top))
        cls = "me" if r["is_subject"] else "them"
        name = html.escape(r["name"])
        out.append(
            f'<text class="lbl {cls}" x="{LBL-10}" y="{y+BH/2+4}" '
            f'text-anchor="end">{name}</text>')
        # Square at the baseline, 4px rounded at the data end.
        out.append(
            f'<path class="bar {cls}" d="M{LBL} {y} H{LBL+bw-4} a4 4 0 0 1 4 4 '
            f'V{y+BH-4} a4 4 0 0 1 -4 4 H{LBL} Z"><title>{name}: '
            f'{fmt(r[key])}</title></path>')
        out.append(f'<text class="val" x="{LBL+bw+8}" y="{y+BH/2+4}">'
                   f'{fmt(r[key])}</text>')
    out.append("</svg>")
    return "\n".join(out)


def render(res: dict) -> str:
    pct = lambda v: f"{(v or 0)*100:.0f}%"
    tbl, subject = res["table"], res["subject"]
    me = next(r for r in tbl if r["is_subject"])
    meta = res.get("meta", {})
    top = next((r for r in tbl if not r["is_subject"]), None)
    blind, rates = res["blind_spots"], res["prompt_rates"]

    gap = ""
    if top and top["appearance_rate"] > me["appearance_rate"]:
        mult = (top["appearance_rate"] / me["appearance_rate"]
                if me["appearance_rate"] else None)
        gap = (f"<strong>{html.escape(top['name'])}</strong> appears "
               f"{f'{mult:.1f}x more often' if mult else 'far more often'} "
               f"than you do.")

    banner = ("<div class='warn'>Offline fixture — synthetic numbers, "
              "not a real measurement.</div>") if meta.get("offline") else ""

    blind_rows = "".join(
        f"<tr><td>{html.escape(b['prompt'])}</td>"
        f"<td class='num'>{len(b['rivals'])}</td>"
        f"<td>{html.escape(', '.join(b['rivals'][:4]))}"
        f"{'…' if len(b['rivals'])>4 else ''}</td></tr>"
        for b in blind[:15]) or "<tr><td colspan=3 class='empty'>None — you appear somewhere in every question tested.</td></tr>"

    rate_rows = "".join(
        f"<tr><td>{html.escape(r['prompt'])}</td>"
        f"<td class='num'>{pct(r['rate'])}</td></tr>" for r in rates[:25])

    tbl_rows = "".join(
        f"<tr class='{'me' if r['is_subject'] else ''}'>"
        f"<td>{html.escape(r['name'])}</td>"
        f"<td class='num'>{pct(r['appearance_rate'])}</td>"
        f"<td class='num'>{pct(r['share_of_voice'])}</td>"
        f"<td class='num'>{r['mean_rank'] if r['mean_rank'] else '—'}</td></tr>"
        for r in tbl)

    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Visibility Audit — {html.escape(subject)}</title>
<style>
:root{{color-scheme:light;--surface:#fcfcfb;--card:#fff;--ink:#0b0b0b;
--ink2:#52514e;--muted:#8a8a82;--line:#e4e3de;--me:#2a78d6;--them:#c6c5bd;}}
@media (prefers-color-scheme:dark){{:root:where(:not([data-theme=light])){{
color-scheme:dark;--surface:#1a1a19;--card:#232322;--ink:#fff;--ink2:#c3c2b7;
--muted:#9a9a90;--line:#383835;--me:#3987e5;--them:#55554f;}}}}
:root[data-theme=dark]{{color-scheme:dark;--surface:#1a1a19;--card:#232322;
--ink:#fff;--ink2:#c3c2b7;--muted:#9a9a90;--line:#383835;--me:#3987e5;--them:#55554f;}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--surface);color:var(--ink);
font:16px/1.55 ui-sans-serif,-apple-system,"Segoe UI",Roboto,sans-serif;}}
.wrap{{max-width:820px;margin:0 auto;padding:40px 16px 72px}}
h1{{font-size:1.6rem;margin:0 0 4px;letter-spacing:-.02em}}
h2{{font-size:1.05rem;margin:40px 0 4px;letter-spacing:-.01em}}
.sub{{color:var(--ink2);margin:0 0 4px}}
.hero{{background:var(--card);border:1px solid var(--line);border-radius:14px;
padding:26px;margin:26px 0}}
.big{{font-size:3.4rem;line-height:1;font-weight:650;letter-spacing:-.03em;
color:var(--me)}}
.hero p{{margin:10px 0 0;color:var(--ink2)}}
.chart{{width:100%;height:auto;margin:10px 0 4px}}
.bar.me{{fill:var(--me)}} .bar.them{{fill:var(--them)}}
.grid{{stroke:var(--line);stroke-width:1}}
.lbl{{fill:var(--ink2);font-size:13px}} .lbl.me{{fill:var(--ink);font-weight:600}}
.val{{fill:var(--ink2);font-size:12px}} .tick{{fill:var(--muted);font-size:11px}}
.bar{{transition:opacity .12s}} .bar:hover{{opacity:.78}}
.key{{display:flex;gap:18px;color:var(--ink2);font-size:.85rem;margin:2px 0 0}}
.key i{{width:11px;height:11px;border-radius:3px;display:inline-block;
margin-right:6px;vertical-align:-1px}}
table{{width:100%;border-collapse:collapse;margin-top:10px;font-size:.9rem}}
th,td{{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);
vertical-align:top}}
th{{color:var(--muted);font-weight:600;font-size:.76rem;text-transform:uppercase;
letter-spacing:.05em}}
td.num{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}}
tr.me td{{font-weight:650}}
.empty{{color:var(--muted)}}
.note{{color:var(--muted);font-size:.82rem;margin-top:40px;
border-top:1px solid var(--line);padding-top:16px}}
.warn{{background:#eda100;color:#0b0b0b;padding:9px 13px;border-radius:9px;
font-weight:600;font-size:.85rem;margin-bottom:18px}}
@media print{{body{{background:#fff}}.wrap{{padding:0}}
.hero,table{{break-inside:avoid}}}}
</style></head><body><div class="wrap">
{banner}
<h1>AI Visibility Audit</h1>
<p class="sub">{html.escape(subject)} — {html.escape(meta.get('category',''))}</p>
<p class="sub" style="font-size:.85rem;color:var(--muted)">
{_dt.date.today().isoformat()} · {res['n_answers']} answers ·
model {html.escape(str(meta.get('model','—')))}</p>

<div class="hero">
  <div class="big">{pct(me['appearance_rate'])}</div>
  <p>of buyer-intent answers mention {html.escape(subject)}. {gap}</p>
</div>

<h2>Who the model names</h2>
<p class="sub" style="font-size:.88rem">Share of answers mentioning each brand.</p>
{_bars(tbl, 'appearance_rate', pct)}
<p class="key"><span><i style="background:var(--me)"></i>{html.escape(subject)}</span>
<span><i style="background:var(--them)"></i>Competitors</span></p>

<h2>Share of voice</h2>
<p class="sub" style="font-size:.88rem">Each brand's slice of all brand mentions.</p>
{_bars(tbl, 'share_of_voice', pct)}

<h2>Blind spots</h2>
<p class="sub" style="font-size:.88rem">Questions where competitors get named and
{html.escape(subject)} never does. This is the actionable list.</p>
<table><thead><tr><th>Buyer question</th><th class="num">Rivals</th>
<th>Who shows up instead</th></tr></thead><tbody>{blind_rows}</tbody></table>

<h2>Weakest questions</h2>
<table><thead><tr><th>Buyer question</th>
<th class="num">You appear</th></tr></thead><tbody>{rate_rows}</tbody></table>

<h2>All figures</h2>
<table><thead><tr><th>Brand</th><th class="num">Appears in</th>
<th class="num">Share of voice</th><th class="num">Avg. position</th></tr></thead>
<tbody>{tbl_rows}</tbody></table>

<p class="note"><strong>Method.</strong> Each question was sent
{meta.get('runs_per_prompt','—')} times with no system prompt, so the answers
match what a buyer sees. Brand mentions are matched on name and known aliases;
"avg. position" is the order a brand is first named within an answer.
Measured against {html.escape(str(meta.get('model','—')))}; other assistants
will differ, and answers shift over time — treat this as a dated snapshot.</p>
</div></body></html>"""
