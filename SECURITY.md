# Security Documentation

## Overview

This document outlines the security features implemented in the AoE2 Web Edition project.

## Security Features

### 1. HTTPS and Security Headers

- **HTTPS Redirect**: Automatic redirect to HTTPS in production
- **HSTS**: HTTP Strict Transport Security with 1-year duration
- **Content Security**: X-Content-Type-Options and X-Frame-Options headers
- **Secure Cookies**: HTTPS-only cookies in production

Configuration in `server/core/settings.py`:
```python
SECURE_SSL_REDIRECT = True  # In production
SECURE_HSTS_SECONDS = 31536000
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### 2. Rate Limiting

#### API Rate Limits
- Anonymous users: 100 requests/hour
- Authenticated users: 1000 requests/hour
- Login endpoint: 5 attempts/hour
- WebSocket connections: 200 messages/minute

#### Brute Force Protection
- Django Defender implementation
- Max 5 failed login attempts
- 5-minute cooloff period
- IP and username-based lockout

### 3. Authentication & Authorization

- JWT-based authentication using `djangorestframework-simplejwt`
- Token refresh mechanism
- Password validation with Django validators
- Secure password hashing (PBKDF2)

### 4. Database Security

- Connection pooling (CONN_MAX_AGE = 600 seconds)
- Query timeout (30 seconds)
- Parameterized queries (SQL injection prevention)
- Database password stored in environment variables

### 5. Secrets Management

All sensitive configuration is stored in environment variables:

```bash
SECRET_KEY=...           # Django secret key
DB_PASSWORD=...          # Database password
SENTRY_DSN=...          # Sentry monitoring DSN
JWT_SECRET=...          # JWT signing key
```

Never commit the `.env` file to version control.

### 6. CORS Configuration

- Whitelist-based CORS configuration
- Credentials allowed only for trusted origins
- Configurable via environment variables

### 7. Error Monitoring with Sentry

- Automatic error tracking in production
- Performance monitoring (10% sample rate)
- PII (Personally Identifiable Information) filtering
- Integration with Django, Celery, and Redis

### 8. Input Validation

- Django form validation
- DRF serializer validation
- Type checking with mypy
- ESLint for frontend code quality

## CI/CD Security

### Automated Security Checks

1. **Dependency Scanning**
   - Python: Safety check
   - Node.js: npm audit
   - Weekly scheduled scans

2. **Code Analysis**
   - CodeQL for JavaScript and Python
   - Bandit for Python security issues
   - ESLint for JavaScript/TypeScript

3. **Vulnerability Scanning**
   - Trivy for container images
   - TruffleHog for secret detection

4. **SARIF Reports**
   - Uploaded to GitHub Security tab
   - Automated vulnerability alerts

## Best Practices

### For Developers

1. **Never commit secrets**
   - Use `.env` files (gitignored)
   - Use environment variables in production
   - Rotate secrets regularly

2. **Input validation**
   - Validate all user inputs
   - Use Django/DRF validators
   - Sanitize data before database operations

3. **Authentication**
   - Use JWT tokens for API authentication
   - Implement token refresh mechanism
   - Set appropriate token expiration times

4. **Database queries**
   - Use Django ORM (prevents SQL injection)
   - Avoid raw SQL when possible
   - Use `select_related` and `prefetch_related` for performance

5. **Error handling**
   - Don't expose sensitive information in error messages
   - Log errors to Sentry
   - Use appropriate HTTP status codes

### For Deployment

1. **Environment variables**
   ```bash
   SECRET_KEY=<strong-random-key>
   DEBUG=False
   ALLOWED_HOSTS=yourdomain.com
   SECURE_SSL_REDIRECT=True
   SENTRY_DSN=<your-sentry-dsn>
   ```

2. **Database**
   - Use strong passwords
   - Enable SSL/TLS for database connections
   - Regular backups
   - Restrict network access

3. **Web server**
   - Use HTTPS (TLS 1.2+)
   - Configure proper security headers
   - Use reverse proxy (nginx/Apache)
   - Enable rate limiting at proxy level

4. **Monitoring**
   - Enable Sentry in production
   - Monitor failed login attempts
   - Set up alerts for security events
   - Regular log reviews

## Security Incident Response

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email security concerns to: [security contact email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Updates

- Review and update dependencies monthly
- Monitor GitHub security advisories
- Subscribe to security mailing lists for Django, Node.js
- Apply security patches promptly

## Testing Security

Run security tests locally:

```bash
# Backend security checks
cd server
bandit -r .
safety check

# Frontend security checks
cd client
npm audit
```

## Compliance

This application implements security controls aligned with:
- OWASP Top 10
- Django Security Best Practices
- REST API Security Guidelines

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security](https://docs.djangoproject.com/en/stable/topics/security/)
- [DRF Security](https://www.django-rest-framework.org/topics/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
