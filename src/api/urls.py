"""API routes for the Click & Collect backend."""

from django.urls import path

from src.api import auth

urlpatterns = [
    path('api/auth/send-confirmation', auth.send_confirmation),
    path('api/auth/confirm-email', auth.confirm_email),
    path('api/auth/check-token', auth.check_token),
]
