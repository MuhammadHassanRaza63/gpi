"""Optional password gate for the whole site (dashboards hold company data).
Set DASHBOARD_USER and DASHBOARD_PASSWORD in the environment to turn it on; leave them unset for local work."""
import base64
import hmac
import os

from django.http import HttpResponse


class BasicAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.user = os.environ.get("DASHBOARD_USER", "")
        self.password = os.environ.get("DASHBOARD_PASSWORD", "")

    def __call__(self, request):
        if not (self.user and self.password) or request.path.startswith("/static/") or request.path in ("/chat/voice/query/", "/chat/voice/health/"):
            return self.get_response(request)
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if header.startswith("Basic "):
            try:
                u, _, p = base64.b64decode(header[6:]).decode().partition(":")
                if hmac.compare_digest(u, self.user) and hmac.compare_digest(p, self.password):
                    return self.get_response(request)
            except Exception:
                pass
        resp = HttpResponse("Login required", status=401)
        resp["WWW-Authenticate"] = 'Basic realm="RCTO Central"'
        return resp
