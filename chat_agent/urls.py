from django.urls import path

from . import views, voice

app_name = "chat_agent"

urlpatterns = [
    path("", views.chat_ui, name="chat"),                    # Zee Chatbot page
    path("api/", views.chat_with_data, name="api"),          # POST {"query": "..."} -> {"answer": "..."}
    path("voice/query/", voice.voice_query, name="voice_query"),   # ElevenLabs voice agent tool (webhook)
    path("voice/health/", voice.voice_health, name="voice_health"),   # DB connectivity check for the voice webhook
]
