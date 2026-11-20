from django.urls import path
from django.views.generic import RedirectView

from . import views

app_name = "grid_report"

urlpatterns = [
    path("", RedirectView.as_view(pattern_name="grid_report:report", permanent=False), name="home"),
    path("report/", views.report, name="report"),                        # /grid/report/
    path("dashboard/", views.dashboard, name="dashboard"),               # /grid/dashboard/
    path("analysis/", views.analysis, name="analysis"),                  # /grid/analysis/
    path("lte/", views.lte, name="lte"),                                 # /grid/lte/
    path("production/", views.production_dashboard, name="production"),  # /grid/production/
    path("data.json", views.report_json, name="data"),
    path("lte.json", views.lte_json, name="lte_data"),
]