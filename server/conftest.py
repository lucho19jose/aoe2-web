"""
Pytest configuration and fixtures for the server tests.
"""
import pytest
from django.contrib.auth.models import User


@pytest.fixture
def user(db):
    """Create a test user."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )


@pytest.fixture
def api_client():
    """Create a DRF API client."""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_client(user, api_client):
    """Create an authenticated API client."""
    api_client.force_authenticate(user=user)
    return api_client
