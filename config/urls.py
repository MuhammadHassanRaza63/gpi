from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('grid/', include('grid_report.urls')),   # Grid Excellence module
    path('chat/', include('chat_agent.urls')),    # Zee Chatbot
    path('', include('dashboard.urls')),
]
