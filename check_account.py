#!/usr/bin/env python3
"""Checks plan/credits, the agent's TTS model and voice availability (needs key permissions: Voices=Read, User=Access, Models=Access).
    python check_account.py
Re-uses ELEVENLABS_API_KEY from setup_voice_agent.py. Prints no secrets."""
import sys

from setup_voice_agent import ELEVENLABS_API_KEY, AGENT_ID, call

key = (ELEVENLABS_API_KEY or "").strip() or sys.exit("setup_voice_agent.py ke top par ELEVENLABS_API_KEY bharo.")


def safe(method, path):
    try:
        return call(method, path, key)
    except SystemExit as e:                       # call() exits on API errors; show it and carry on
        print("   ->", str(e).strip().splitlines()[-1][:300])
        return None


agent = call("GET", f"/v1/convai/agents/{AGENT_ID}", key)["conversation_config"]
tts = agent.get("tts", {})
model_id, voice_id = tts.get("model_id"), tts.get("voice_id")
print("Agent TTS      :", model_id, "|", voice_id, "| agent language:", agent.get("agent", {}).get("language"))

print("\n== Plan / credits ==")
sub = safe("GET", "/v1/user/subscription")
if sub:
    for k in ("tier", "status", "character_count", "character_limit", "next_character_count_reset_unix",
              "billing_period", "currency"):
        if k in sub:
            print(f"{k:32}: {sub[k]}")
    for k, v in sub.items():
        if any(w in k.lower() for w in ("convai", "agent", "minute", "voice_slot", "voice_limit")):
            print(f"{k:32}: {v}")
    used, limit = sub.get("character_count"), sub.get("character_limit")
    if isinstance(used, (int, float)) and isinstance(limit, (int, float)) and limit:
        print(f"{'credits left':32}: {limit - used}  ({used}/{limit} used)")

print("\n== Models ==")
models = safe("GET", "/v1/models")
if isinstance(models, list):
    ids = {m.get("model_id"): m for m in models}
    m = ids.get(model_id)
    print(f"agent model '{model_id}' in your account's model list:", "YES" if m else "NO")
    if m:
        print("   can_do_text_to_speech:", m.get("can_do_text_to_speech"), "| can_be_finetuned:", m.get("can_be_finetuned"))
    print("TTS models available:", [i for i, x in ids.items() if x.get("can_do_text_to_speech")])

print("\n== Voice ==")
v = safe("GET", f"/v1/voices/{voice_id}")
if v:
    print("name:", v.get("name"), "| category:", v.get("category"), "| available_for_tiers:", v.get("available_for_tiers"))
    print("verified_languages:", [x.get("language") for x in (v.get("verified_languages") or [])])
else:
    print("Voice nahi mili (404) ho to wo voice tumhare account mein maujood nahi hai.")

print("\nYe poora output bhej do.")