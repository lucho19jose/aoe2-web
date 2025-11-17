#!/bin/sh
# Database backup script
# Runs daily via cron to backup PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/aoe2_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=${DB_BACKUP_RETENTION_DAYS:-30}

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Create backup
echo "Starting database backup at $(date)"
pg_dump -h ${PGHOST} -U ${PGUSER} -d ${PGDATABASE} | gzip > ${BACKUP_FILE}

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup completed successfully: ${BACKUP_FILE}"

    # Calculate backup size
    BACKUP_SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
    echo "Backup size: ${BACKUP_SIZE}"
else
    echo "Backup failed!"
    exit 1
fi

# Delete old backups (keep only last N days)
echo "Cleaning up old backups (retention: ${RETENTION_DAYS} days)"
find ${BACKUP_DIR} -name "aoe2_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# List remaining backups
echo "Current backups:"
ls -lh ${BACKUP_DIR}/aoe2_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo "Backup process completed at $(date)"
