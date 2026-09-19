#!/usr/bin/env python3
"""AI Visibility Audit — measure whether a brand shows up in LLM answers.

Sends realistic buyer-intent questions to a model with no system prompt (so the
answer matches what a real buyer would see), repeats each question to get a
rate rather than an anecdote, and scores which brands get mentioned and where.

    python3 -m aivis.audit run config/example.json -o out/
    python3 -m aivis.audit run config/example.json -o out/ --offline
"""

from __future__ import annotations

import argparse
import concurrent.futures as cf
import json
import re
import statistics
import sys
from dataclasses import dataclass, asdict, field
from pathlib import Path

MEASURE_MODEL = "claude-sonnet-5"   # what a typical buyer is likely to be using
PROMPT_MODEL = "claude-opus-5"      # generating the question set is a judgment task


# --------------------------------------------------------------------------- #
# config
# --------------------------------------------------------------------------- #

@dataclass
class Brand:
    name: str
    aliases: list[str] = field(default_factory=list)

    @property
    def patterns(self) -> list[re.Pattern]:
        return [re.compile(rf"\b{re.escape(t)}\b", re.I)
                for t in [self.name, *self.aliases]]

    def first_hit(self, text: str) -> int | None:
        """Character index of the earliest mention, or None."""
        hits = [m.start() for p in self.patterns if (m := p.search(text))]
        return min(hits) if hits else None


@dataclass
class Config:
    brand: Brand
    category: str
    competitors: list[Brand]
    prompts: list[str] = field(default_factory=list)
    runs: int = 5
    n_prompts: int = 20

    @property
    def all_brands(self) -> list[Brand]:
        return [self.brand, *self.competitors]

    @staticmethod
    def load(path: Path) -> "Config":
        d = json.loads(path.read_text())
        return Config(
            brand=Brand(d["brand"], d.get("aliases", [])),
            category=d["category"],
            competitors=[Brand(c["name"], c.get("aliases", []))
                         for c in d.get("competitors", [])],
            prompts=d.get("prompts", []),
            runs=int(d.get("runs", 5)),
            n_prompts=int(d.get("n_prompts", 20)),
        )


# --------------------------------------------------------------------------- #
# model calls
# --------------------------------------------------------------------------- #

def client():
    import anthropic
    return anthropic.Anthropic(max_retries=5)


def _extract_json_array(text: str):
    start, end = text.find("["), text.rfind("]")
    if start == -1 or end == -1:
        raise ValueError(f"no JSON array in model output: {text[:200]!r}")
    return json.loads(text[start:end + 1])


def generate_prompts(cli, category: str, n: int) -> list[str]:
    """Ask for the questions a real buyer would type, not branded queries."""
    msg = (
        f"A buyer is researching {category} and has not yet chosen a vendor.\n\n"
        f"Write the {n} questions they would most plausibly type into an AI "
        f"assistant during that research. Rules:\n"
        f"- No brand names in the questions. These are unbranded, top-of-funnel.\n"
        f"- Mix: category overviews, 'best/top' requests, comparison framings, "
        f"problem-first phrasings, and buying-criteria questions.\n"
        f"- Phrase them the way a busy person actually types, not like marketing copy.\n\n"
        f"Return ONLY a JSON array of {n} strings."
    )
    r = cli.messages.create(
        model=PROMPT_MODEL, max_tokens=4000,
        messages=[{"role": "user", "content": msg}],
    )
    return _extract_json_array("".join(
        b.text for b in r.content if b.type == "text"))[:n]


def ask(cli, prompt: str, model: str, effort: str) -> str:
    """One buyer question, asked exactly as a buyer would ask it.

    Deliberately no system prompt: a system prompt would measure our framing
    rather than what the buyer actually sees.
    """
    r = cli.messages.create(
        model=model, max_tokens=2000,
        output_config={"effort": effort},
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(b.text for b in r.content if b.type == "text")


# --------------------------------------------------------------------------- #
# measurement
# --------------------------------------------------------------------------- #

@dataclass
class Answer:
    prompt: str
    run: int
    text: str


def measure(cli, prompts: list[str], runs: int, model: str,
            effort: str, workers: int = 8) -> list[Answer]:
    jobs = [(p, i) for p in prompts for i in range(runs)]
    out: list[Answer] = []
    with cf.ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(ask, cli, p, model, effort): (p, i) for p, i in jobs}
        for n, f in enumerate(cf.as_completed(futs), 1):
            p, i = futs[f]
            try:
                out.append(Answer(p, i, f.result()))
            except Exception as e:                      # keep the run alive
                print(f"  ! {type(e).__name__} on {p[:50]!r}: {e}", file=sys.stderr)
            print(f"\r  {n}/{len(jobs)} answers", end="", file=sys.stderr)
    print(file=sys.stderr)
    return out


def score(answers: list[Answer], brands: list[Brand], subject: Brand) -> dict:
    per_brand = {b.name: {"mentions": 0, "ranks": []} for b in brands}
    per_prompt: dict[str, dict] = {}

    for a in answers:
        hits = {b.name: idx for b in brands
                if (idx := b.first_hit(a.text)) is not None}
        order = sorted(hits, key=hits.get)
        for rank, name in enumerate(order, 1):
            per_brand[name]["mentions"] += 1
            per_brand[name]["ranks"].append(rank)

        pp = per_prompt.setdefault(a.prompt, {"n": 0, "subject": 0, "rivals": set()})
        pp["n"] += 1
        if subject.name in hits:
            pp["subject"] += 1
        pp["rivals"].update(n for n in order if n != subject.name)

    total = len(answers) or 1
    table = []
    for b in brands:
        d = per_brand[b.name]
        table.append({
            "name": b.name,
            "is_subject": b.name == subject.name,
            "mentions": d["mentions"],
            "appearance_rate": d["mentions"] / total,
            "mean_rank": round(statistics.fmean(d["ranks"]), 2) if d["ranks"] else None,
        })
    table.sort(key=lambda r: (-r["appearance_rate"], r["mean_rank"] or 99))

    all_mentions = sum(r["mentions"] for r in table) or 1
    for r in table:
        r["share_of_voice"] = r["mentions"] / all_mentions

    # The money insight: questions where rivals show up and the subject never does.
    blind_spots = sorted(
        ({"prompt": p,
          "rivals": sorted(v["rivals"]),
          "runs": v["n"]}
         for p, v in per_prompt.items()
         if v["subject"] == 0 and v["rivals"]),
        key=lambda d: -len(d["rivals"]))

    prompt_rates = sorted(
        ({"prompt": p, "rate": v["subject"] / v["n"], "runs": v["n"]}
         for p, v in per_prompt.items()),
        key=lambda d: d["rate"])

    return {
        "table": table,
        "blind_spots": blind_spots,
        "prompt_rates": prompt_rates,
        "n_answers": len(answers),
        "subject": subject.name,
    }


# --------------------------------------------------------------------------- #
# offline fixture (lets the pipeline be verified without a key)
# --------------------------------------------------------------------------- #

def offline_answers(cfg: Config) -> list[Answer]:
    import random
    rng = random.Random(7)
    prompts = cfg.prompts or [f"[sample question {i+1} about {cfg.category}]"
                              for i in range(6)]
    names = [b.name for b in cfg.all_brands]
    weights = {n: (0.25 if n == cfg.brand.name else rng.uniform(0.4, 0.85))
               for n in names}
    out = []
    for p in prompts:
        for i in range(cfg.runs):
            picked = [n for n in names if rng.random() < weights[n]]
            rng.shuffle(picked)
            body = " ".join(f"{n} is a common choice here." for n in picked)
            out.append(Answer(p, i, f"[OFFLINE FIXTURE — not a real measurement] {body}"))
    return out


# --------------------------------------------------------------------------- #

def cmd_run(a):
    cfg = Config.load(Path(a.config))
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)

    if a.offline:
        print("offline mode — synthetic fixture, not a real measurement")
        answers = offline_answers(cfg)
        meta = {"model": "OFFLINE FIXTURE", "effort": "n/a"}
    else:
        cli = client()
        if not cfg.prompts:
            print(f"generating {cfg.n_prompts} buyer questions...")
            cfg.prompts = generate_prompts(cli, cfg.category, cfg.n_prompts)
        print(f"measuring {len(cfg.prompts)} questions x {cfg.runs} runs...")
        answers = measure(cli, cfg.prompts, cfg.runs, a.model, a.effort)
        meta = {"model": a.model, "effort": a.effort}

    res = score(answers, cfg.all_brands, cfg.brand)
    res["meta"] = {**meta, "runs_per_prompt": cfg.runs,
                   "category": cfg.category, "offline": a.offline}
    (out / "results.json").write_text(json.dumps(res, indent=2, default=list) + "\n")
    (out / "answers.json").write_text(
        json.dumps([asdict(x) for x in answers], indent=2) + "\n")

    from aivis.render import render
    (out / "report.html").write_text(render(res))

    me = next(r for r in res["table"] if r["is_subject"])
    print(f"\n  {cfg.brand.name}: appears in {me['appearance_rate']:.0%} "
          f"of {res['n_answers']} answers | SoV {me['share_of_voice']:.0%}")
    print(f"  blind spots: {len(res['blind_spots'])} questions")
    print(f"  -> {out/'report.html'}")
    return 0


def main():
    p = argparse.ArgumentParser(description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("config")
    r.add_argument("-o", "--out", default="out")
    r.add_argument("--model", default=MEASURE_MODEL)
    r.add_argument("--effort", default="low", choices=["low","medium","high"])
    r.add_argument("--offline", action="store_true")
    r.set_defaults(fn=cmd_run)
    a = p.parse_args()
    sys.exit(a.fn(a))


if __name__ == "__main__":
    main()
