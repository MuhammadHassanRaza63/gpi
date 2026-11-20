from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('dashboards/', views.dashboards, name='dashboards'),
    path('dashboards/analysis/', views.analysis, name='analysis'),
    path('complaints/', views.central, name='central'),
]