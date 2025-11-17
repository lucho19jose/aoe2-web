# Production Readiness Checklist

Use this checklist before deploying to production to ensure everything is properly configured.

## Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] `.env.production` file created from `.env.production.example`
- [ ] `SECRET_KEY` is a strong, random string (min 50 characters)
- [ ] `DEBUG=False` is set
- [ ] `ALLOWED_HOSTS` contains your domain
- [ ] Database credentials are strong and unique
- [ ] Redis password is set and strong
- [ ] `CORS_ALLOWED_ORIGINS` contains only your production domains
- [ ] `CSRF_TRUSTED_ORIGINS` configured correctly
- [ ] Email settings configured (if using email features)
- [ ] Sentry DSN configured (recommended for error tracking)

### 2. Security

- [ ] SSL/HTTPS configured via Let's Encrypt
- [ ] Security headers configured in Nginx
- [ ] HSTS enabled in Django settings
- [ ] Secure cookies enabled (`SESSION_COOKIE_SECURE=True`)
- [ ] CSRF protection enabled
- [ ] Rate limiting configured in Nginx
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] `.env.production` is in `.gitignore`
- [ ] No secrets committed to git
- [ ] Strong database password
- [ ] Strong Redis password

### 3. Database

- [ ] PostgreSQL configured and running
- [ ] Database migrations run successfully
- [ ] Database backups configured
- [ ] Backup retention policy set
- [ ] Test backup restoration works
- [ ] Database indexes optimized
- [ ] Connection pooling configured

### 4. Static & Media Files

- [ ] Static files collected: `python manage.py collectstatic`
- [ ] Nginx configured to serve static files
- [ ] Media files directory configured
- [ ] Proper permissions on static/media directories
- [ ] CDN configured (optional)

### 5. Docker & Services

- [ ] All Docker images build successfully
- [ ] `docker-compose.prod.yml` configured correctly
- [ ] All services start without errors
- [ ] Health checks pass for all services
- [ ] Docker volumes configured for persistence
- [ ] Resource limits set for containers
- [ ] Restart policies configured (`restart: unless-stopped`)

### 6. Monitoring & Logging

- [ ] Logging configured (file rotation enabled)
- [ ] Log level set appropriately (`INFO` for production)
- [ ] Sentry error tracking configured
- [ ] Health check endpoints working (`/api/health/`, `/api/ready/`)
- [ ] Prometheus/Grafana configured (optional)
- [ ] Alerting configured (optional)
- [ ] Uptime monitoring configured (optional)

### 7. Performance

- [ ] Gzip compression enabled in Nginx
- [ ] Redis caching configured
- [ ] Database query optimization done
- [ ] Static files have cache headers
- [ ] Celery workers configured
- [ ] Connection pooling enabled
- [ ] CDN configured for static assets (optional)

### 8. Backup & Recovery

- [ ] Database backup script tested
- [ ] Backup restoration tested
- [ ] Backups stored securely (off-server)
- [ ] Backup schedule configured
- [ ] Recovery plan documented
- [ ] Disaster recovery plan in place

### 9. Testing

- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] Integration tests pass
- [ ] Load testing performed (optional)
- [ ] Security scanning performed
- [ ] Vulnerability scanning performed

### 10. CI/CD

- [ ] GitHub Actions workflow configured
- [ ] Secrets configured in GitHub
- [ ] Automated tests run on PR
- [ ] Automated deployment configured
- [ ] Deployment rollback plan in place

### 11. Documentation

- [ ] `README.md` updated
- [ ] `DEPLOYMENT.md` reviewed
- [ ] API documentation generated and accessible
- [ ] Environment variables documented
- [ ] Troubleshooting guide created
- [ ] Runbooks created for common operations

### 12. Domain & DNS

- [ ] Domain registered
- [ ] DNS A record points to server IP
- [ ] DNS www record configured
- [ ] DNS propagation verified
- [ ] SSL certificate issued for domain
- [ ] Email DNS records configured (SPF, DKIM, DMARC) if sending emails

### 13. Application-Specific

- [ ] Admin user created
- [ ] Initial data loaded (if needed)
- [ ] Game assets uploaded/configured
- [ ] WebSocket connections tested
- [ ] Real-time features tested
- [ ] Multiplayer functionality tested

### 14. Legal & Compliance

- [ ] Privacy policy created (if collecting user data)
- [ ] Terms of service created
- [ ] GDPR compliance verified (if applicable)
- [ ] Cookie consent implemented (if applicable)
- [ ] Data retention policy defined

### 15. Post-Deployment

- [ ] Verify all services running: `docker-compose ps`
- [ ] Check health endpoints: `curl https://yourdomain.com/api/health/`
- [ ] Check readiness: `curl https://yourdomain.com/api/ready/`
- [ ] Test frontend loads correctly
- [ ] Test user registration/login
- [ ] Test game creation/joining
- [ ] Test WebSocket connections
- [ ] Monitor logs for errors: `docker-compose logs -f`
- [ ] Check SSL certificate: `https://www.ssllabs.com/ssltest/`
- [ ] Check security headers: `https://securityheaders.com/`
- [ ] Verify backups are running
- [ ] Set up monitoring alerts

## Quick Verification Commands

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Check health
curl https://yourdomain.com/api/health/
curl https://yourdomain.com/api/ready/

# Check logs
docker-compose -f docker-compose.prod.yml logs --tail=100

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null | openssl x509 -noout -dates

# Check database connection
docker-compose -f docker-compose.prod.yml exec db psql -U $DB_USER -d $DB_NAME -c "SELECT version();"

# Check Redis connection
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# Check disk space
df -h

# Check memory usage
free -m

# Check Docker disk usage
docker system df
```

## Security Verification

```bash
# Test rate limiting
ab -n 100 -c 10 https://yourdomain.com/api/games/

# Check for common vulnerabilities
docker run --rm -v $(pwd):/src trufflesecurity/trufflehog filesystem /src

# Check dependencies for vulnerabilities
cd server && safety check
cd client && npm audit

# Scan Docker images
docker scan aoe2-backend:latest
docker scan aoe2-frontend:latest
```

## Performance Verification

```bash
# Test page load time
curl -o /dev/null -s -w "Time: %{time_total}s\n" https://yourdomain.com/

# Test API response time
curl -o /dev/null -s -w "Time: %{time_total}s\n" https://yourdomain.com/api/games/

# Check resource usage
docker stats --no-stream
```

## Notes

- [ ] Production deployment date: ___________
- [ ] Deployed by: ___________
- [ ] Version/commit hash: ___________
- [ ] Issues encountered: ___________
- [ ] Post-deployment tasks: ___________

---

**IMPORTANT**: Do not deploy to production until ALL items are checked!
