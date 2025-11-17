# Deployment Guide - AOE2 Web Edition

Complete guide for deploying AOE2 Web Edition to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Server Setup](#initial-server-setup)
- [SSL Certificate Setup](#ssl-certificate-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Deployment](#deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Hardware Requirements (Minimum)

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: 100 Mbps

### Software Requirements

- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **Docker**: 24.0+
- **Docker Compose**: 2.20+
- **Git**: 2.0+
- **Domain**: A registered domain pointing to your server

---

## Initial Server Setup

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Install Git

```bash
sudo apt install git -y
```

### 4. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/yourusername/aoe2-web.git
cd aoe2-web
sudo chown -R $USER:$USER .
```

### 5. Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## SSL Certificate Setup

### 1. Configure Environment

```bash
# Copy environment template
cp .env.production.example .env.production

# Edit with your domain
nano .env.production
```

Set these critical variables:
```bash
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com
```

### 2. Run SSL Initialization Script

```bash
chmod +x scripts/init-letsencrypt.sh
./scripts/init-letsencrypt.sh
```

This script will:
- Download SSL parameters
- Create temporary certificates
- Start Nginx
- Request real Let's Encrypt certificates
- Configure auto-renewal

---

## Environment Configuration

### 1. Configure Production Variables

Edit `.env.production` with your production values:

```bash
# Django Settings
SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_NAME=aoe2_production
DB_USER=aoe2_user
DB_PASSWORD=<strong-random-password>

# Redis
REDIS_PASSWORD=<strong-random-password>

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Sentry (Error Tracking) - Optional but recommended
ENABLE_SENTRY=True
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 2. Update Nginx Configuration

Edit `nginx/conf.d/aoe2.conf` and replace `${DOMAIN}` with your actual domain:

```bash
# Use envsubst to replace environment variables
export DOMAIN=yourdomain.com
envsubst '${DOMAIN}' < nginx/conf.d/aoe2.conf.template > nginx/conf.d/aoe2.conf
```

Or manually replace all instances of `${DOMAIN}` in the file.

---

## Database Setup

### 1. Initialize Database

```bash
# Start only database and redis
docker-compose -f docker-compose.prod.yml up -d db redis

# Wait for database to be ready
sleep 10

# Run migrations
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate

# Create superuser
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py createsuperuser
```

### 2. Load Initial Data (Optional)

```bash
# If you have fixtures
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py loaddata initial_data.json
```

---

## Deployment

### Option 1: Automated Deployment (Recommended)

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The script will:
1. Pull latest code
2. Build Docker images
3. Create database backup
4. Run migrations
5. Collect static files
6. Start all services
7. Run health checks

### Option 2: Manual Deployment

```bash
# Pull latest code
git pull origin main

# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Post-Deployment Verification

### 1. Check Service Health

```bash
# Check all containers are running
docker-compose -f docker-compose.prod.yml ps

# Check health endpoints
curl https://yourdomain.com/api/health/
curl https://yourdomain.com/api/ready/
```

### 2. Access Admin Panel

Navigate to `https://yourdomain.com/admin/` and log in with your superuser credentials.

### 3. Monitor Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

---

## Monitoring & Maintenance

### Database Backups

Backups run automatically daily. Manual backup:

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U $DB_USER $DB_NAME | gzip > backup_$(date +%Y%m%d).sql.gz

# Or use the backup script
chmod +x scripts/backup-db.sh
docker-compose -f docker-compose.prod.yml exec db-backup /usr/local/bin/backup-db.sh
```

### Restore from Backup

```bash
chmod +x scripts/restore-db.sh
docker-compose -f docker-compose.prod.yml run --rm -v ./backups/db:/backups db-backup /usr/local/bin/restore-db.sh /backups/backup_20240115.sql.gz
```

### SSL Certificate Renewal

Certificates auto-renew via certbot container. Manual renewal:

```bash
docker-compose -f docker-compose.prod.yml run --rm certbot renew
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Redeploy
./scripts/deploy.sh
```

### View Resource Usage

```bash
docker stats
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs [service-name]

# Restart specific service
docker-compose -f docker-compose.prod.yml restart [service-name]

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build [service-name]
```

### Database Connection Issues

```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps db

# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Connect to database
docker-compose -f docker-compose.prod.yml exec db psql -U $DB_USER -d $DB_NAME
```

### SSL Certificate Issues

```bash
# Check certificate expiry
docker-compose -f docker-compose.prod.yml run --rm certbot certificates

# Force renewal
docker-compose -f docker-compose.prod.yml run --rm certbot renew --force-renewal
```

### High Memory Usage

```bash
# Check which containers use most memory
docker stats --no-stream

# Restart heavy services
docker-compose -f docker-compose.prod.yml restart celery backend

# Clear Redis cache
docker-compose -f docker-compose.prod.yml exec redis redis-cli FLUSHDB
```

### WebSocket Connection Issues

1. Check Nginx WebSocket configuration in `nginx/conf.d/aoe2.conf`
2. Verify CORS settings in `.env.production`
3. Check Daphne logs: `docker-compose -f docker-compose.prod.yml logs backend`

### Static Files Not Loading

```bash
# Recollect static files
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput

# Restart Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## Scaling

### Horizontal Scaling

To scale specific services:

```bash
# Scale backend workers
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale celery workers
docker-compose -f docker-compose.prod.yml up -d --scale celery=4
```

### Vertical Scaling

Edit `docker-compose.prod.yml` to add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## Security Best Practices

1. **Keep secrets in `.env.production`** - Never commit to git
2. **Regular updates**: Update Docker images and system packages
3. **Monitor logs**: Check for suspicious activity
4. **Use Sentry**: Track and fix errors in production
5. **Database backups**: Verify backups work regularly
6. **Firewall**: Only allow necessary ports
7. **SSL**: Keep certificates up to date
8. **Rate limiting**: Configure Nginx rate limits appropriately

---

## CI/CD with GitHub Actions

The repository includes GitHub Actions workflow for automated deployments.

### Setup:

1. Add secrets in GitHub repository settings:
   - `PRODUCTION_HOST`: Your server IP/domain
   - `PRODUCTION_USER`: SSH username
   - `PRODUCTION_SSH_KEY`: Private SSH key

2. Push to main branch triggers automatic deployment

---

## Support

For issues and questions:
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review logs: `docker-compose -f docker-compose.prod.yml logs`
- Open an issue on GitHub
- Contact: admin@yourdomain.com

---

## Additional Resources

- [Django Deployment Checklist](https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Configuration](https://nginx.org/en/docs/)
