"""
Tests for health check endpoints
"""
import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestHealthEndpoints:
    """Test health check endpoints"""

    def test_health_check(self, api_client):
        """Test basic health check endpoint"""
        url = reverse('health-check')
        response = api_client.get(url)

        assert response.status_code == 200
        assert response.data['status'] == 'healthy'
        assert response.data['service'] == 'aoe2-web-api'

    def test_readiness_check(self, api_client):
        """Test readiness check endpoint"""
        url = reverse('readiness-check')
        response = api_client.get(url)

        # Should return 200 or 503 depending on services
        assert response.status_code in [200, 503]
        assert 'status' in response.data
        assert 'checks' in response.data

        # Check that all expected services are checked
        assert 'database' in response.data['checks']
        assert 'redis' in response.data['checks']
        assert 'cache' in response.data['checks']

    def test_health_check_no_authentication_required(self, api_client):
        """Test that health checks don't require authentication"""
        # Health check should work without authentication
        url = reverse('health-check')
        response = api_client.get(url)
        assert response.status_code == 200

        # Readiness check should work without authentication
        url = reverse('readiness-check')
        response = api_client.get(url)
        assert response.status_code in [200, 503]
