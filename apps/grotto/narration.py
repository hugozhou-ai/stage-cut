"""Optional regeneration: uv run --with edge-tts python narration.py"""
import asyncio
import json
from pathlib import Path

import edge_tts

LINES = ["向内而行，把黑暗留给远方。", "一盏灯，让壁上的千年醒来。", "镜中无尽，照见的也是此刻。", "让每一粒微尘，都成为星河。"]

async def main():
    for index, text in enumerate(LINES):
        output = Path(__file__).parent / "public" / f"voice-{index}.mp3"
        await edge_tts.Communicate(text, "zh-CN-YunxiNeural", rate="-18%", pitch="-5Hz").save(str(output))
        print("[grotto-voice] " + json.dumps({"index": index, "text": text, "file": str(output)}, ensure_ascii=False))

asyncio.run(main())
