"""Voice agent (ElevenLabs) <-> project database bridge — Multi-Team Complete Data, Noise Filter, Tabular + Spoken TTS, & Zero-CUD.

Endpoint:
    POST /chat/voice/query/     header X-Voice-Secret: <VOICE_WEBHOOK_SECRET>     body {"query": "..."}
    GET  /chat/voice/health/    header X-Voice-Secret: <VOICE_WEBHOOK_SECRET>
"""
import hmac
import json
import re
from decimal import Decimal

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from . import views as chat_views

NOT_IN_DB = "Ye information mere database mein maujood nahi hai, is liye main iska jawab nahi de sakta."
NO_RECORD = "Database mein is filter ke liye koi record nahi mila."
READ_ONLY = "Main sirf read-only analytics aur comparisons ke liye authorized hoon. Create, Update, ya Delete operations allowed nahi hain."
RETRY_MSG = ("Ye sawal database se resolve nahi ho saka. Please thoda specific poochein, "
             "masalan region, mahina ya site ID bata dein.")

VOICE_CONVERSATION_CONTEXT = {
    "last_user_query": "",
    "last_sql_query": "",
    "last_tables": [],
    "last_answer": ""
}

_NUM = re.compile(r'\d[\d,]*(?:\.\d+)?')
_NOISE_RE = re.compile(r'^[\s\.\,\?\!\@\#\-\_]+$|keyboard\s*clacking|background\s*noise|inaudible|typing', re.IGNORECASE)


def _authorized(request) -> bool:
    secret = getattr(settings, 'VOICE_WEBHOOK_SECRET', '')
    if not secret:
        return False
    return hmac.compare_digest(request.headers.get('X-Voice-Secret', ''), secret)


def _clean_for_tts(text: str) -> str:
    """Strips markdown/symbols and keeps clean digits, decimals (.), and percentages (%)."""
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    text = re.sub(r"[*_`#>|•\-]", " ", text)
    text = re.sub(r'\bLS\b', 'Load Shedding', text)
    text = re.sub(r'\bFTR\b', 'First Time Resolution', text)
    text = re.sub(r'\bCRR\b', 'Customer Resolution Rate', text)
    text = re.sub(r'\bCRS\b', 'Customer Resolution Satisfaction', text)
    text = re.sub(r'\bCRM\b', 'Customer Resolution Maintenance', text)
    text = re.sub(r'\bTAT\b', 'Turn Around Time', text)
    text = re.sub(r'(\d+)\s+point\s+(\d+)', r'\1.\2', text, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", text).strip()


def _is_num(v) -> bool:
    return isinstance(v, (int, float, Decimal)) and not isinstance(v, bool)


def _fmt(v) -> str:
    if v is None:
        return "–"
    if _is_num(v):
        f = float(v)
        return f"{int(f):,}" if f == int(f) else f"{f:,.2f}".rstrip('0').rstrip('.')
    return str(v)


def _to_floats(text: str):
    out = []
    for m in _NUM.findall(text):
        try:
            out.append(float(m.replace(',', '')))
        except ValueError:
            pass
    return out


def _allowed_numbers(user_query, cols, rows):
    allowed = {float(len(rows)), 2025.0, 2026.0, 5.0, 6.0, 10.0, 12.0}
    allowed.update(float(i) for i in range(1, 13))
    allowed.update(_to_floats(user_query))
    for c in cols:
        allowed.update(_to_floats(str(c)))
    for r in rows:
        for v in r:
            if _is_num(v):
                f = float(v)
                allowed.update({f, round(f, 2), round(f, 1), round(f), float(int(f))})
            elif v is not None:
                allowed.update(_to_floats(str(v)))
    return allowed


def _ungrounded(answer, user_query, cols, rows):
    allowed = _allowed_numbers(user_query, cols, rows)
    bad = []
    for n in _to_floats(answer):
        if not any(abs(n - a) <= max(0.02, abs(a) * 0.005) for a in allowed):
            bad.append(n)
    return bad


def _rule_based_answer(cols, rows):
    clean_cols = [str(c).replace('_', ' ') for c in cols]
    if len(rows) == 1:
        items = [f"{c} is {_fmt(v)}" for c, v in zip(clean_cols, rows[0]) if v is not None]
        return "Database ke mutabiq, " + ", aur ".join(items) + "."
    parts = []
    for r in rows[:6]:
        row_txt = ", ".join(f"{c} {_fmt(v)}" for c, v in zip(clean_cols, r) if v is not None)
        parts.append(row_txt)
    tail = f" Kul {len(rows)} records hain." if len(rows) > 6 else ""
    return "Database ke mutabiq: " + ". ".join(parts) + "." + tail


_SAY_RULES = """STRICT VOICE & WRITTEN TRANSCRIPT RULES (live voice database analyst):
1. ALWAYS write ALL numbers, decimals (.), and percentages (%) strictly as numeric digits (e.g., 410, 98.22%, 6,953) — NEVER spell numbers out in English, Urdu, or Roman Urdu words (NEVER write "chaar soo daas" or "four hundred ten").
2. Use ONLY the facts and numbers present in DATA below. Do NOT invent or estimate any number not in DATA.
3. If DATA contains multiple teams (e.g., FOPs C1 to C6) or multiple months (Jan to Oct), summarize ALL teams/groups present in DATA concisely—do NOT stop after just the first team!
4. Keep the spoken response natural and concise (3 to 5 short sentences, max 95 words).
5. NO markdown, NO tables, NO bullet points, NO asterisks, NO emojis in the spoken answer.
6. Reply in the exact language of the caller (English, Urdu, or Roman Urdu). Keep telecom terms (Availability, Load Shedding, OFC, CRR, CRS, TAT) in English.
7. NEVER call "LS" Lost-Signal or traffic throttling—LS ALWAYS means "Load Shedding".
8. Never mention any telecom operator or company brand name."""


@csrf_exempt
@require_POST
def voice_query(request):
    if not _authorized(request):
        return JsonResponse({"error": "unauthorized"}, status=401)
    try:
        payload = json.loads(request.body or b'{}')
    except ValueError:
        payload = {}
    user_query = str(payload.get('query', '')).strip()
    user_query = re.sub(r'^[@#.\s]+', '', user_query).strip()

    if not user_query or _NOISE_RE.search(user_query) or len(user_query) < 3:
        return JsonResponse({"answer": "Awaaz clear nahi aayi, please apna network data sawal dobara poochein."})

    q = user_query.lower()

    # Instant greeting
    if q in ['hi', 'hello', 'hey', 'salam', 'assalam o alaikum', 'aoa']:
        return JsonResponse({
            "answer": "Assalam o Alaikum! Main Zee hoon. Aap network ki availability, load shedding, revenue, OFC cuts, ya customer complaints ka analysis aur comparison pooch sakte hain."
        })

    # Capability question (Charts / Plots / Chatbot)
    if any(k in q for k in ['plot', 'chart', 'graph', 'dashboard', 'chatbot']) and not any(
        d in q for d in ['avail', 'ls', 'load', 'complaint', 'crr', 'crs', 'tat', 'ofc', 'revenue', 'site', 'fops', 'central', 'month']
    ):
        return JsonResponse({
            "answer": "Ji bilkul! Main live network database se har KPI ka analysis kar sakta hoon, aur Zee Chatbot screen par interactive charts, plots, aur tables bhi generate hote hain. Aap kis metric ka chart ya data dekhna chahte hain?"
        })

    # Strict Zero-CUD & Security Guardrail
    if any(w in q for w in ['password', 'secret_key', 'api_key', 'credential']) or chat_views._CUD_INTENT_RE.search(user_query):
        return JsonResponse({"answer": READ_ONLY})

    api_key = getattr(settings, 'GROQ_API_KEY', None)
    if not api_key:
        return JsonResponse({"answer": "Server par GROQ API key set nahi hai."}, status=503)

    try:
        from langchain_groq import ChatGroq
        from . import db
        dialect = db.dialect()
        label = 'PostgreSQL' if dialect == 'postgresql' else 'SQLite'
        llm = ChatGroq(
            temperature=0,
            model_name=settings.CHAT_MODEL,
            api_key=api_key,
            max_tokens=1200,
            reasoning_effort="low"
        )

        is_followup = chat_views.is_followup_query(user_query)
        tables = chat_views.select_relevant_tables(user_query)
        if is_followup and VOICE_CONVERSATION_CONTEXT["last_tables"] and tables == ['grid_tracker']:
            tables = list(VOICE_CONVERSATION_CONTEXT["last_tables"])

        schema = chat_views.get_table_metadata_with_categories(tables)
        if not schema:
            return JsonResponse({"answer": "Data abhi load nahi hua. Admin se upload_rcto_data chalwayen."})

        followup_block = ""
        if VOICE_CONVERSATION_CONTEXT["last_user_query"]:
            followup_block = f"""
PREVIOUS VOICE TURN (Use ONLY if the caller is asking a follow-up like "aur Central 2 ka?", "baqi teams ka?", or "month on month"):
- Previous Caller Question: {VOICE_CONVERSATION_CONTEXT["last_user_query"]}
- Previous SQL Executed: {VOICE_CONVERSATION_CONTEXT["last_sql_query"]}
"""

        # Check if user asked for ALL teams / ALL months / per group
        is_multi_group = any(k in q for k in ['each', 'every', 'all', 'per', 'wise', 'month on month', 'mom', 'fops', 'sub region', 'sub-region', 'central'])

        sql_prompt = f"""You are the Lead {label} Architect for Telecom Network Intelligence.
Write ONLY a valid read-only {label} `SELECT` query to answer the caller's voice question from the schema below.
If the question is garbled STT noise or completely unrelated to telecom network data (general knowledge, weather, jokes, random words), output ONLY: NO_DATA

{chat_views.telecom_domain_rules(dialect)}
{followup_block}

SCHEMA:
{schema}

STRICT VOICE SQL RULES:
1. Return ONLY raw read-only SQL (`SELECT ...`) or `NO_DATA`. Never generate INSERT, UPDATE, DELETE, DROP, ALTER, or CREATE.
2. Wrap all table and column names in double quotes.
3. NEVER use `SELECT *`! Select only the 1 to 5 aggregated columns needed.
4. When grouping by team (`"Routing Team"` / `"Team"`), `"Sub Region"`, or `"Month"` / `"Month#"`, DO NOT put `LIMIT 5` or `LIMIT 10` so ALL teams (C1 to C6) and ALL months are returned!
5. For ungrouped top-N rankings without a specified number, use `LIMIT 5`.
6. `"revenue_norm30_oct_2026"` DOES NOT EXIST in `"grid_tracker"` (use `"revenue_norm30_sep_2026"` or `"ytd_revenue_jan_sep_2026"`).
{chat_views.sql_rules(dialect)}

Caller Question: {user_query}
SQL:"""

        raw = chat_views.invoke_llm_with_retry(llm, sql_prompt)
        if 'NO_DATA' in raw.upper() and 'SELECT' not in raw.upper():
            return JsonResponse({"answer": NOT_IN_DB})

        sql = chat_views.extract_sql(raw, user_query)
        if not chat_views.is_safe_select(sql):
            return JsonResponse({"answer": READ_ONLY})

        try:
            cols, rows = chat_views._run_query(sql)
        except Exception as db_err:
            print(f"[Voice SQL Self-Healing Retry]: {db_err}")
            fix = f"""Your {label} query failed with error: {db_err}
Fix it using ONLY exact column names below; double-quote all table and column names.
{chat_views.sql_rules(dialect)}

{schema}

Caller Question: {user_query}
Corrected SQL:"""
            sql = chat_views.extract_sql(chat_views.invoke_llm_with_retry(llm, fix), user_query)
            if not chat_views.is_safe_select(sql):
                return JsonResponse({"answer": READ_ONLY})
            cols, rows = chat_views._run_query(sql)

        rows = [tuple(round(float(v), 2) if isinstance(v, (float, Decimal)) else v for v in r) for r in rows]
        print(f"[Voice] Q={user_query!r} | Tables={tables} | rows={len(rows)} | SQL={sql}")

        if not rows or all(all(v is None for v in r) for r in rows):
            return JsonResponse({"answer": NO_RECORD})

        # Pass up to 65 rows for multi-group summaries (e.g. 6 teams x 10 months = 60 rows) so C1..C6 are all covered!
        max_context_rows = 65 if is_multi_group else 12
        shown = rows[:max_context_rows]
        data_block = f"Columns: {list(cols)}\nTotal rows returned: {len(rows)} (showing {len(shown)})\nRows: {shown}"

        say_prompt = f"""You are reading live database results aloud over a voice call.
{_SAY_RULES}

Caller Question: {user_query}
DATA:
{data_block}

Spoken answer (use numeric digits like 410 and 98.22%, never spelled-out words, and cover all teams/months if grouped):"""

        answer = _clean_for_tts(chat_views.invoke_llm_with_retry(llm, say_prompt))

        bad = _ungrounded(answer, user_query, cols, shown)
        if bad or not answer:
            retry = say_prompt.replace("Spoken answer (use numeric digits like 410 and 98.22%, never spelled-out words, and cover all teams/months if grouped):", (
                f"WARNING: Your previous draft used numbers not in DATA: {bad}. "
                "Rewrite using ONLY exact numeric digits from DATA (e.g. 410).\nSpoken answer:"))
            answer = _clean_for_tts(chat_views.invoke_llm_with_retry(llm, retry))
            bad = _ungrounded(answer, user_query, cols, shown)

        if bad or not answer:
            print(f"[Voice] Ungrounded numbers {bad} -> falling back to rule-based spoken answer")
            answer = _rule_based_answer(cols, shown)

        # Also build a clean Markdown Table for tabular display if needed
        table_md = chat_views.build_markdown_table(cols, shown)

        VOICE_CONVERSATION_CONTEXT["last_user_query"] = user_query
        VOICE_CONVERSATION_CONTEXT["last_sql_query"] = sql
        VOICE_CONVERSATION_CONTEXT["last_tables"] = tables
        VOICE_CONVERSATION_CONTEXT["last_answer"] = answer

        return JsonResponse({
            "answer": answer,
            "table_markdown": table_md,
            "source": "database",
            "rows": len(rows)
        })

    except ImportError as e:
        return JsonResponse({"answer": f"Server package missing: {e.name}"}, status=503)
    except Exception as e:
        print(f"[Voice query error]: {e}")
        return JsonResponse({"answer": RETRY_MSG})


@csrf_exempt
def voice_health(request):
    """GET /chat/voice/health/ (header X-Voice-Secret). Verifies all 21 database tables and row counts."""
    if not _authorized(request):
        return JsonResponse({"error": "unauthorized"}, status=401)
    try:
        from sqlalchemy import inspect, text
        from . import db
        names = sorted([t for t in inspect(db.get_engine()).get_table_names() if not t.startswith(('django_', 'auth_', 'sqlite_'))])
        counts = {}
        with db.read_only_connection() as conn:
            for t in names:
                try:
                    counts[t] = conn.execute(text(f'SELECT COUNT(*) FROM "{t}"')).scalar()
                except Exception as e:
                    counts[t] = f"error: {e}"
        return JsonResponse({
            "database": "connected",
            "dialect": db.dialect(),
            "total_tables": len(counts),
            "tables": counts
        })
    except Exception as e:
        return JsonResponse({"database": "NOT connected", "error": str(e)}, status=500)