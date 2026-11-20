# Voice agent (ElevenLabs) -> Database : setup

Agent id: agent_2301m7q53mm2ex4vrfhja8sk8n0z

## Sabse tez tareeqa (1 command)
1. Project ko **public https URL** par chalao (Azure ya local par `ngrok http 8000`). ElevenLabs localhost tak nahi pahunch sakta —
   yahi sabse bari wajah hoti hai ke agent DB se connected nahi hota.
2. `.env` mein set karo: `VOICE_WEBHOOK_SECRET=<koi lamba random string>` aur server restart karo.
   (Azure/ngrok domain ke liye `ALLOWED_HOSTS` / `CSRF_TRUSTED_ORIGINS` mein domain hona chahiye, default `*` hai.)
3. ElevenLabs -> Developers -> API Keys se key banao. Phir:
```
# Windows (cmd)
set ELEVENLABS_API_KEY=xi-xxxxxxxx
set VOICE_WEBHOOK_SECRET=<wahi secret jo .env mein hai>
python setup_voice_agent.py --base-url https://YOUR-PUBLIC-DOMAIN

# Linux / Mac
export ELEVENLABS_API_KEY=xi-xxxxxxxx
export VOICE_WEBHOOK_SECRET=<same secret>
python3 setup_voice_agent.py --base-url https://YOUR-PUBLIC-DOMAIN
```
Script ye sab karta hai:
- Project ka `/chat/voice/health/` check karta hai (DB connected + har table ki row count) aur ek test sawal chalata hai.
- ElevenLabs mein `query_zee_database` tool banata/update karta hai aur agent se attach karta hai.
- Agent ka DB-only system prompt, temperature 0, first message lagata hai (Knowledge Base khali).
- **Interruptions OFF** (agent apna poora jawab khatam karta hai, beech mein nahi rukta), turn-taking "patient", wait 10 sec.

## Manual check (curl)
```
curl https://YOUR-DOMAIN/chat/voice/health/ -H "X-Voice-Secret: <secret>"
curl -X POST https://YOUR-DOMAIN/chat/voice/query/ -H "Content-Type: application/json" -H "X-Voice-Secret: <secret>" -d "{\"query\":\"Central region ki average availability kitni hai?\"}"
```

## Agar script nahi chalani (dashboard se manual)
Dekho **VOICE_AGENT_PROMPT.md**. Beech mein rukne ka fix: Agent -> **Advanced** tab -> **Client events** mein se `interruption`
untick karo, aur tool mein "Disable interruptions" on karo; Turn eagerness = Patient.

## Anti-hallucination (server side)
1. Jawab sirf DB se aaye rows se likha jata hai (koi bahar ka knowledge / wajah / mashwara nahi).
2. Jawab ke har number ko rows se verify kiya jata hai; match na ho to rewrite, phir bhi na ho to rows se seedha rule-based jawab.
3. Jo sawal schema se related nahi uska fixed jawab: "database mein maujood nahi".

## Tip
Agent ko bolte waqt headphones lagao. Speaker ki awaz dobara mic mein jaye to agent usay user ki awaz samajh leta hai.
