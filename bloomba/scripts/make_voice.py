"""Record Bloomba's spoken lines into public/voice/*.mp3.

Uses the Kokoro text-to-speech model (Apache-2.0), which runs offline.
Setup, once:
    pip install kokoro-onnx soundfile
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
Run from the bloomba folder (needs ffmpeg):
    python scripts/make_voice.py --model-dir path/to/model/files

The texts must match `lines` in src/game.js.
"""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "voice"
VOICE = "af_heart"
SPEED = 0.85


def all_lines():
    items = json.loads((ROOT / "src" / "items.json").read_text())
    phrases = json.loads((ROOT / "src" / "phrases.json").read_text())
    yield "welcome", phrases["welcome"]
    yield "round-done", phrases["roundDone"]
    for i, text in enumerate(phrases["praise"]):
        yield f"praise-{i}", text
    for category in items.values():
        for item in category:
            yield f"find-{item['id']}", f"Can you find {item['spoken']}?"
            yield f"thats-{item['id']}", f"That's {item['spoken']}!"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", default=".")
    args = parser.parse_args()
    model_dir = Path(args.model_dir)
    kokoro = Kokoro(str(model_dir / "kokoro-v1.0.onnx"), str(model_dir / "voices-v1.0.bin"))
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for name, text in all_lines():
            samples, rate = kokoro.create(text, voice=VOICE, speed=SPEED, lang="en-us")
            wav = Path(tmp) / f"{name}.wav"
            sf.write(wav, samples, rate)
            # Trim leading silence, add a short tail, encode as small mono mp3.
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
                 "-af", "silenceremove=start_periods=1:start_threshold=-50dB,apad=pad_dur=0.1",
                 "-ac", "1", "-b:a", "48k", str(OUT / f"{name}.mp3")],
                check=True,
            )
            print(name, "-", text)


if __name__ == "__main__":
    main()
