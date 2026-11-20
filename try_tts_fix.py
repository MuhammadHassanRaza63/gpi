#!/usr/bin/env python3
"""EXPERIMENT: switch the agent's TTS to a safe model + premade voice to test 'call_initialization_error'.
    python try_tts_fix.py            # backup current tts settings to tts_backup.json, then switch
    python try_tts_fix.py --revert   # restore the backed-up settings
Re-uses ELEVENLABS_API_KEY from setup_voice_agent.py."""
import json, os, sys

from setup_voice_agent import ELEVENLABS_API_KEY, AGENT_ID, call

key = (ELEVENLABS_API_KEY or "").strip() or sys.exit("setup_voice_agent.py ke top par ELEVENLABS_API_KEY bharo.")
BACKUP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tts_backup.json")
NEW = {"model_id": "eleven_flash_v2_5", "voice_id": "21m00Tcm4TlvDq8ikWAM"}   # Rachel (premade)

cur = call("GET", f"/v1/convai/agents/{AGENT_ID}", key)["conversation_config"].get("tts", {})
if "--revert" in sys.argv:
    old = json.load(open(BACKUP))
    call("PATCH", f"/v1/convai/agents/{AGENT_ID}", key, {"conversation_config": {"tts": old}})
    print("Restored:", old)
else:
    if not os.path.exists(BACKUP):
        json.dump({k: cur[k] for k in ("model_id", "voice_id") if k in cur}, open(BACKUP, "w"))
    call("PATCH", f"/v1/convai/agents/{AGENT_ID}", key, {"conversation_config": {"tts": NEW}})
    now = call("GET", f"/v1/convai/agents/{AGENT_ID}", key)["conversation_config"].get("tts", {})
    print("TTS now:", now.get("model_id"), now.get("voice_id"), "| backup saved in tts_backup.json")
    print("Ab website par 'hi' bol kar dobara test karo.")