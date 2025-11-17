#!/bin/bash

# Automated deployment script for production
# This script handles the full deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f .env.production ]; then
    log_error ".env.production file not found!"
    log_info "Please copy .env.production.example to .env.production and configure it"
    exit 1
fi

# Load environment variables
source .env.production

log_info "Starting deployment for AOE2 Web Edition"
log_info "Domain: $DOMAIN"
echo ""

# Step 1: Pull latest changes
log_info "Step 1/8: Pulling latest changes from git..."
git pull origin $(git branch --show-current)
echo ""

# Step 2: Build Docker images
log_info "Step 2/8: Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache
echo ""

# Step 3: Stop old containers (but keep database running)
log_info "Step 3/8: Stopping old containers..."
docker-compose -f docker-compose.prod.yml stop backend celery celery-beat frontend nginx
echo ""

# Step 4: Database backup
log_info "Step 4/8: Creating database backup..."
BACKUP_DIR="./backups/db"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/pre_deploy_backup_${TIMESTAMP}.sql.gz"

docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U ${DB_USER} ${DB_NAME} | gzip > $BACKUP_FILE
log_info "Backup created: $BACKUP_FILE"
echo ""

# Step 5: Run database migrations
log_info "Step 5/8: Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate --noinput
echo ""

# Step 6: Collect static files
log_info "Step 6/8: Collecting static files..."
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput
echo ""

# Step 7: Start services
log_info "Step 7/8: Starting services..."
docker-compose -f docker-compose.prod.yml up -d
echo ""

# Step 8: Health check
log_info "Step 8/8: Running health checks..."
sleep 10

# Check backend health
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health/ || echo "000")
if [ "$BACKEND_HEALTH" = "200" ]; then
    log_info "✓ Backend is healthy"
else
    log_error "✗ Backend health check failed (HTTP $BACKEND_HEALTH)"
    log_warn "Rolling back deployment..."
    docker-compose -f docker-compose.prod.yml down
    exit 1
fi

# Check readiness
BACKEND_READY=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/ready/ || echo "000")
if [ "$BACKEND_READY" = "200" ]; then
    log_info "✓ Backend is ready (all services connected)"
else
    log_warn "⚠ Backend readiness check failed (HTTP $BACKEND_READY)"
    log_warn "Some services might not be fully ready yet"
fi

echo ""
log_info "================================"
log_info "Deployment completed successfully!"
log_info "================================"
log_info ""
log_info "Services status:"
docker-compose -f docker-compose.prod.yml ps
echo ""
log_info "Logs command: docker-compose -f docker-compose.prod.yml logs -f"
log_info "Stop command: docker-compose -f docker-compose.prod.yml down"
