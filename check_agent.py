#!/usr/bin/env python3
"""Diagnose why the ElevenLabs widget says 'The AI agent you are trying to reach is not available'.
Run from the same folder as setup_voice_agent.py (it re-uses the API key you pasted there):
    python check_agent.py
Prints only settings (never the API key)."""
import json, sys

from setup_voice_agent import ELEVENLABS_API_KEY, AGENT_ID, AGENT_ID_SOURCE, call

key = (ELEVENLABS_API_KEY or "").strip() or sys.exit("setup_voice_agent.py ke top par ELEVENLABS_API_KEY bharo.")
print(f"Agent id in use: {AGENT_ID or chr(40)+'none'+chr(41)}  [from: {AGENT_ID_SOURCE}]")


def find(obj, words, path=""):
    """Yield (path, value) for every key whose name contains one of `words`."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            p = f"{path}.{k}" if path else k
            if any(w in k.lower() for w in words) and v not in (None, "", [], {}):
                yield p, v
            yield from find(v, words, p)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from find(v, words, f"{path}[{i}]")


agent = call("GET", f"/v1/convai/agents/{AGENT_ID}", key)
cc, ps = agent.get("conversation_config", {}), agent.get("platform_settings", {})
prompt = cc.get("agent", {}).get("prompt", {})

print("== Agent ==")
print("name           :", agent.get("name"))
print("llm            :", prompt.get("llm"), "| custom_llm:", bool(prompt.get("custom_llm")))
print("language       :", cc.get("agent", {}).get("language"))
print("tts voice_id   :", cc.get("tts", {}).get("voice_id"), "| model:", cc.get("tts", {}).get("model_id"))
print("tool_ids       :", prompt.get("tool_ids"))
print("knowledge_base :", prompt.get("knowledge_base"))
print("\n== Access (Security tab) ==")
auth = ps.get("auth", {}) or {}
print("enable_auth    :", auth.get("enable_auth"))
print("allowlist      :", auth.get("allowlist"))
print("call_limits    :", ps.get("call_limits"))
print("overrides      :", ps.get("overrides"))

print("\n== Recent conversations (failure reasons) ==")
try:
    convs = call("GET", f"/v1/convai/conversations?agent_id={AGENT_ID}&page_size=5", key).get("conversations", [])
except SystemExit as e:
    convs = []
    print("conversations list nahi mil saki:", e)
if not convs:
    print("Koi conversation record nahi mila (call connect hi nahi hui, to history mein nahi aati).")
for c in convs[:5]:
    print("-", c.get("conversation_id"), "| status:", c.get("status"), "| successful:", c.get("call_successful"),
          "| secs:", c.get("call_duration_secs"))
    try:
        d = call("GET", f"/v1/convai/conversations/{c.get('conversation_id')}", key)
        for p, v in find({"status": d.get("status"), "metadata": d.get("metadata", {})}, ("error", "reason", "fail", "status")):
            print("    ", p, "=", json.dumps(v)[:300])
    except SystemExit as e:
        print("    detail nahi mila:", str(e)[:200])
print("\nYe poora output (key ke baghair) bhej do.")