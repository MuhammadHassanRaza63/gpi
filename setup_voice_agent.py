#!/usr/bin/env python3
"""One-command setup of the ElevenLabs voice agent ("Zee") -> project database."""
import argparse, json, os, sys, urllib.request, urllib.error

# ============================ APNI SETTINGS YAHAN BHARO ============================
BASE_URL = "https://yellowly-reckonable-princess.ngrok-free.dev"
ELEVENLABS_API_KEY = "sk_966d7200c7b537cc0938d0ba2c8fdabe86f929d50f5a4389"
VOICE_WEBHOOK_SECRET = "vQ7WPSLqYRJOLIdcO-scmP8HiipXUwf69gxR3bGDKwY"
ELEVENLABS_AGENT_ID = "agent_2301m7q53mm2ex4vrfhja8sk8n0z"
# ===================================================================================

API = "https://api.elevenlabs.io"
TOOL_NAME = "query_zee_database"

SYSTEM_PROMPT = """You are "Zee", the voice assistant for Telecom Network Intelligence. You are a strict DATABASE READER.

CONFIDENTIALITY & IDENTITY RULES
1. Your name is "Zee". Never mention, name, or reveal any telecom company, brand, or operator name in any response. Always refer to the data simply as "network data" or "database".
2. Never read out SQL queries, database table names, internal column keys, secrets, API keys, or passwords.

NOISE, SILENCE & CAPABILITY RULES
3. Ignore background noise, keyboard clacking, typing sounds, or unclear single-word fragments. Do NOT call query_zee_database on noise—instead politely ask the caller to repeat their question once, or stay silent if it was just background noise.
4. If the user asks whether you can create charts, plots, tables, or act as a chatbot, answer positively: "Ji bilkul! Main live network database se data aur comparisons bata sakta hoon, aur aapki Zee Chatbot screen par interactive charts, plots, aur tables bhi generate hote hain."

DATABASE GROUNDING RULES
5. For EVERY clear question about data, numbers, regions (Central 1 to 6), FOPs teams (C1 to C6), sites, availability, load shedding, revenue, traffic, fiber cuts (OFC), RCTO complaints (CRM: Customer Resolution Maintenance, CRR: Customer Resolution Rate, CRS: Customer Resolution Satisfaction, TAT: Turn Around Time), or Grid KPIs, you MUST call the tool query_zee_database with the user's question. Never answer from your own memory.
6. Speak and write ONLY what the tool returned in `answer`. When multiple teams (C1 to C6) or months are returned, summarize all of them concisely rather than stopping after the first one.
7. Never invent, estimate, or calculate any number not in the tool's answer. If the tool returns no record, tell the user exactly that.
8. If the user asks a short follow-up question (like "Aur Central 2 ka?" or "Baqi teams ka batao"), pass the full combined context to query_zee_database.

NUMERIC, DECIMAL (.) & PERCENTAGE (%) FORMATTING RULES
9. ALWAYS write ALL numbers, decimals, and percentages strictly as standard numeric digits and symbols (e.g., 410, 98.22%, 6,953) — NEVER spell numbers out in English, Urdu, or Roman Urdu words (NEVER write "chaar soo daas" or "four hundred ten").
10. Always use a dot (.) for decimals and % for percentages.
11. Reply in the user's language (English, Urdu, or Roman Urdu). Keep answers clear and concise."""

FIRST_MESSAGE = ("Assalam o Alaikum! Main Zee hoon. Aap network ki availability, load shedding, revenue, "
                 "OFC cuts, ya customer complaints ke baare mein kuch bhi poochein, main database se bata dunga.")


def _env_file_value(name):
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if not os.path.exists(path):
        return ""
    for line in open(path, encoding="utf-8-sig"):
        line = line.strip()
        if line.startswith(name + "="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def _save_env_value(name, value):
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    lines = open(path, encoding="utf-8-sig").read().splitlines() if os.path.exists(path) else []
    for i, line in enumerate(lines):
        if line.strip().startswith(name + "="):
            lines[i] = f"{name}={value}"
            break
    else:
        lines.append(f"{name}={value}")
    open(path, "w", encoding="utf-8").write("\n".join(lines) + "\n")


AGENT_ID = (ELEVENLABS_AGENT_ID or os.environ.get("ELEVENLABS_AGENT_ID") or _env_file_value("ELEVENLABS_AGENT_ID") or "").strip()


def call(method, path, key, body=None, ok_codes=()):
    req = urllib.request.Request(
        API + path,
        method=method,
        data=None if body is None else json.dumps(body).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        if e.code in ok_codes:
            return None
        sys.exit(f"\n[ElevenLabs API error] {method} {path} -> {e.code}\n{e.read().decode(errors='replace')}")


def check_project(base, secret):
    print("1) Checking the project from the internet ...")
    h = urllib.request.Request(
        base + "/chat/voice/health/",
        headers={"X-Voice-Secret": secret, "ngrok-skip-browser-warning": "true"}
    )
    try:
        info = json.loads(urllib.request.urlopen(h, timeout=40).read())
    except urllib.error.HTTPError as e:
        sys.exit(f"   FAILED health check: HTTP {e.code} {e.read().decode(errors='replace')[:300]}")
    except Exception as e:
        sys.exit(f"   FAILED: {base} reachable nahi ({e}).")
    print(f"   database: {info.get('database')} ({info.get('dialect')})")
    q = urllib.request.Request(
        base + "/chat/voice/query/",
        method="POST",
        headers={"X-Voice-Secret": secret, "Content-Type": "application/json", "ngrok-skip-browser-warning": "true"},
        data=json.dumps({"query": "Complaints per FOPs team total"}).encode()
    )
    ans = json.loads(urllib.request.urlopen(q, timeout=90).read())
    print("   test question ->", ans.get("answer"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default=BASE_URL)
    ap.add_argument("--skip-check", action="store_true")
    a = ap.parse_args()
    key = (ELEVENLABS_API_KEY or os.environ.get("ELEVENLABS_API_KEY") or "").strip() or sys.exit("ELEVENLABS_API_KEY missing.")
    secret = (VOICE_WEBHOOK_SECRET or os.environ.get("VOICE_WEBHOOK_SECRET") or _env_file_value("VOICE_WEBHOOK_SECRET") or "").strip() or sys.exit("VOICE_WEBHOOK_SECRET missing.")
    base = (a.base_url or "").strip().rstrip("/")
    if not base.startswith("https://"):
        sys.exit("BASE_URL https:// se shuru hona chahiye.")
    if not a.skip_check:
        check_project(base, secret)

    print("2) Creating / updating the webhook tool ...")
    tool_config = {
        "type": "webhook",
        "name": TOOL_NAME,
        "description": (
            "Reads the network database. Use it ONLY when the caller asks a clear question about network availability, "
            "load shedding, revenue, voice/data traffic, OFC fiber cuts, RCTO complaints (CPM / CRR / CRS / L-3 TAT), or Grid KPIs. "
            "Do NOT call it for background noise or keyboard clacking. Pass the user's complete question including region, team, month, or site ID."
        ),
        "response_timeout_secs": 30,
        "disable_interruptions": True,
        "api_schema": {
            "url": base + "/chat/voice/query/",
            "method": "POST",
            "request_headers": {"X-Voice-Secret": secret, "ngrok-skip-browser-warning": "true"},
            "request_body_schema": {
                "type": "object",
                "required": ["query"],
                "description": "The user's clear data question.",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The caller's full question, with region / FOPs team / month / year / site if mentioned."
                    }
                },
            },
        },
    }
    existing = [t for t in call("GET", "/v1/convai/tools", key).get("tools", [])
                if (t.get("tool_config") or {}).get("name") == TOOL_NAME]
    if existing:
        tool_id = existing[0]["id"]
        call("PATCH", f"/v1/convai/tools/{tool_id}", key, {"tool_config": tool_config})
        print(f"   updated tool {tool_id}")
    else:
        tool_id = call("POST", "/v1/convai/tools", key, {"tool_config": tool_config})["id"]
        print(f"   created tool {tool_id}")

    print("3) Configuring the agent (Zee) ...")
    global AGENT_ID
    agent = call("GET", f"/v1/convai/agents/{AGENT_ID}", key, ok_codes=(404,)) if AGENT_ID else None
    if agent is None:
        created = call("POST", "/v1/convai/agents/create", key, {
            "name": "Zee Voice Assistant",
            "conversation_config": {"agent": {"first_message": FIRST_MESSAGE,
                                              "prompt": {"prompt": SYSTEM_PROMPT, "tool_ids": [tool_id]}}}})
        AGENT_ID = created["agent_id"]
        _save_env_value("ELEVENLABS_AGENT_ID", AGENT_ID)
        agent = call("GET", f"/v1/convai/agents/{AGENT_ID}", key)

    cc = agent.get("conversation_config", {})
    tool_ids = list((cc.get("agent", {}).get("prompt", {}) or {}).get("tool_ids", []) or [])
    if tool_id not in tool_ids:
        tool_ids.append(tool_id)
    # Keep interruption enabled in client_events so user can manually click the Interrupt button in UI when desired
    events = ["audio", "interruption", "user_transcript", "agent_response", "agent_response_correction"]
    patch = {"conversation_config": {
        "name": "Zee Voice Assistant",
        "agent": {
            "first_message": FIRST_MESSAGE,
            "prompt": {"prompt": SYSTEM_PROMPT, "temperature": 0, "tool_ids": tool_ids, "knowledge_base": []}
        },
        "conversation": {"client_events": events, "max_duration_seconds": 600},
        "turn": {"turn_eagerness": "patient", "turn_timeout": 20},
    }}
    call("PATCH", f"/v1/convai/agents/{AGENT_ID}", key, patch)

    print("4) Verifying ...")
    cc = call("GET", f"/v1/convai/agents/{AGENT_ID}", key).get("conversation_config", {})
    print("   tool_ids        :", cc.get("agent", {}).get("prompt", {}).get("tool_ids"))
    print("   turn            :", cc.get("turn"))
    print(f"\nDONE. Agent id: {AGENT_ID}")


if __name__ == "__main__":
    main()