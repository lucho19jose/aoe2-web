# 🚀 Production Deployment Guide - AoE2 Web Edition

This guide provides step-by-step instructions for deploying the Age of Empires II Web Edition to production.

## 📋 Prerequisites

Before deploying to production, ensure you have:

- [ ] A Linux server (Ubuntu 20.04+ recommended)
- [ ] Docker and Docker Compose installed
- [ ] Domain name configured (e.g., aoe2game.com)
- [ ] SSL certificate (Let's Encrypt recommended)
- [ ] Minimum server requirements:
  - 2 CPU cores
  - 4GB RAM
  - 20GB storage
  - PostgreSQL 15+
  - Redis 7+

## 🔐 Security Checklist

### Before Deployment:

1. **Generate Strong SECRET_KEY**
   ```bash
   cd server
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```

2. **Create Production Environment File**
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production and set all values
   ```

3. **Set Strong Passwords**
   - Database password (minimum 16 characters)
   - Redis password
   - Django SECRET_KEY (generated above)

4. **Configure Domain**
   - Update ALLOWED_HOSTS in .env.production
   - Update CORS_ALLOWED_ORIGINS
   - Update CSRF_TRUSTED_ORIGINS

5. **Verify DEBUG=False**
   - Double-check DEBUG is set to False in production

## 📦 Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone Repository

```bash
# Clone to production directory
cd /opt
sudo git clone https://github.com/lucho19jose/aoe2-web.git
cd aoe2-web

# Set ownership
sudo chown -R $USER:$USER /opt/aoe2-web
```

### 3. Configure Environment

```bash
# Copy and configure production environment
cp .env.production.example .env.production

# Edit with your production values
nano .env.production
```

**Required variables:**
```env
# Django
SECRET_KEY=<your-generated-secret-key>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_NAME=aoe2_web_prod
DB_USER=aoe2_admin
DB_PASSWORD=<strong-db-password>
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<strong-redis-password>

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 4. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be in:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Create SSL directory and copy certificates
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Set permissions
sudo chmod 644 nginx/ssl/fullchain.pem
sudo chmod 600 nginx/ssl/privkey.pem
```

### 5. Configure Nginx

Edit `nginx/conf.d/aoe2.conf`:

```nginx
# Update server_name
server_name yourdomain.com www.yourdomain.com;

# Uncomment HTTPS server block
# Update SSL certificate paths if needed
```

### 6. Build Frontend for Production

```bash
cd client

# Install dependencies
npm ci --production

# Build for production
npm run build

# Verify build output
ls -la dist/
```

### 7. Deploy with Docker Compose

```bash
cd /opt/aoe2-web

# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Verify all services are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 8. Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Collect static files
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### 9. Verify Deployment

#### Health Checks:
```bash
# Check API health
curl https://yourdomain.com/api/health/

# Check if services are up
docker-compose -f docker-compose.prod.yml ps

# Expected output: All services should be "Up (healthy)"
```

#### Manual Testing:
1. Visit https://yourdomain.com
2. Register a new account
3. Login
4. Start a single player game
5. Test multiplayer lobby
6. Verify all features work

### 10. Enable Auto-Start on Reboot

```bash
# Create systemd service
sudo nano /etc/systemd/system/aoe2-web.service
```

Add:
```ini
[Unit]
Description=AoE2 Web Edition
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/aoe2-web
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl daemon-reload
sudo systemctl enable aoe2-web
sudo systemctl start aoe2-web
```

## 🔄 Maintenance

### Update Application

```bash
cd /opt/aoe2-web

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run new migrations if any
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Backup Database

```bash
# Create backup directory
mkdir -p /opt/backups

# Backup PostgreSQL
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U aoe2_admin aoe2_web_prod > /opt/backups/aoe2_backup_$(date +%Y%m%d_%H%M%S).sql

# Automate with cron (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/aoe2-web/scripts/backup.sh
```

### Monitor Logs

```bash
# All logs
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Error logs only
docker-compose -f docker-compose.prod.yml logs -f | grep ERROR
```

### Renew SSL Certificate

```bash
# Certbot auto-renews, but you can manually renew:
sudo certbot renew

# Copy new certificates to nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Reload nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 📊 Monitoring

### Resource Usage

```bash
# Check resource usage
docker stats

# Disk usage
df -h
docker system df
```

### Performance Tuning

#### Database:
- Configure PostgreSQL connection pooling
- Add indexes for frequently queried fields
- Enable query logging in development

#### Redis:
- Monitor memory usage
- Configure max memory policy
- Enable persistence if needed

#### Nginx:
- Enable gzip compression (already configured)
- Configure caching headers
- Rate limiting for API endpoints

## 🛡️ Security Hardening

### Firewall (ufw)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Fail2ban

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Regular Updates

```bash
# Security updates
sudo apt update && sudo apt upgrade -y

# Docker updates
sudo apt upgrade docker-ce docker-ce-cli containerd.io
```

## 🐛 Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Verify environment variables
docker-compose -f docker-compose.prod.yml config

# Check if ports are available
sudo netstat -tulpn | grep LISTEN
```

### Database connection errors

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.prod.yml exec db pg_isready

# Check credentials in .env.production
# Ensure DB_HOST=db (not localhost)
```

### 502 Bad Gateway

```bash
# Check backend is running
docker-compose -f docker-compose.prod.yml exec backend python manage.py check

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# Verify backend health
curl http://localhost:8000/api/health/
```

## 📞 Support

- **Documentation**: `/docs` directory
- **Issues**: https://github.com/lucho19jose/aoe2-web/issues
- **Community**: [Discord/Forum link]

## 📝 Post-Deployment Checklist

- [ ] All services running (docker-compose ps)
- [ ] HTTPS working correctly
- [ ] Database migrations applied
- [ ] Static files serving correctly
- [ ] WebSocket connections working
- [ ] User registration working
- [ ] Login/logout working
- [ ] Game creation working
- [ ] SSL certificate auto-renewal configured
- [ ] Backups configured and tested
- [ ] Monitoring in place
- [ ] Firewall configured
- [ ] Domain DNS configured
- [ ] Email notifications configured (optional)

---

**Last Updated**: 2025-11-17
**Version**: 0.1.0
