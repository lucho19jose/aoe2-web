"""
Custom middleware for AoE2 Web Edition
"""
from django.core.cache import cache
from django.http import JsonResponse
from functools import wraps
import time


class RateLimitMiddleware:
    """
    Simple rate limiting middleware for API endpoints
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip rate limiting for authenticated staff users
        if request.user.is_authenticated and request.user.is_staff:
            return self.get_response(request)

        # Get client IP
        ip = self.get_client_ip(request)

        # Check rate limit for sensitive endpoints
        if self.is_sensitive_endpoint(request.path):
            if not self.check_rate_limit(ip, max_requests=10, window=60):
                return JsonResponse({
                    'error': 'Rate limit exceeded. Please try again later.'
                }, status=429)

        response = self.get_response(request)
        return response

    def get_client_ip(self, request):
        """Get the client's IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def is_sensitive_endpoint(self, path):
        """Check if the endpoint is sensitive and needs stricter rate limiting"""
        sensitive_patterns = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/password-reset',
        ]
        return any(pattern in path for pattern in sensitive_patterns)

    def check_rate_limit(self, identifier, max_requests=100, window=60):
        """
        Check if the request is within rate limits

        Args:
            identifier: Unique identifier (e.g., IP address)
            max_requests: Maximum number of requests allowed
            window: Time window in seconds

        Returns:
            bool: True if within limits, False otherwise
        """
        cache_key = f'rate_limit:{identifier}'
        current_time = int(time.time())

        # Get existing requests from cache
        requests = cache.get(cache_key, [])

        # Remove old requests outside the window
        requests = [req_time for req_time in requests if current_time - req_time < window]

        # Check if limit exceeded
        if len(requests) >= max_requests:
            return False

        # Add current request
        requests.append(current_time)
        cache.set(cache_key, requests, window)

        return True


def rate_limit(max_requests=100, window=60):
    """
    Decorator for rate limiting view functions

    Usage:
        @rate_limit(max_requests=10, window=60)
        def my_view(request):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # Get client IP
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')

            cache_key = f'rate_limit:{func.__name__}:{ip}'
            current_time = int(time.time())

            # Get existing requests
            requests = cache.get(cache_key, [])
            requests = [req_time for req_time in requests if current_time - req_time < window]

            # Check limit
            if len(requests) >= max_requests:
                return JsonResponse({
                    'error': 'Rate limit exceeded. Please try again later.'
                }, status=429)

            # Add current request
            requests.append(current_time)
            cache.set(cache_key, requests, window)

            return func(request, *args, **kwargs)

        return wrapper
    return decorator
