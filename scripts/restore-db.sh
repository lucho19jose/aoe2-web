#!/bin/sh
# Database restore script
# Restores PostgreSQL database from a backup file

set -e

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh /backups/aoe2_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "WARNING: This will restore the database from: ${BACKUP_FILE}"
echo "This will overwrite the current database!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Restore database
echo "Starting database restore at $(date)"
echo "Dropping existing database..."
dropdb -h ${PGHOST} -U ${PGUSER} --if-exists ${PGDATABASE}

echo "Creating new database..."
createdb -h ${PGHOST} -U ${PGUSER} ${PGDATABASE}

echo "Restoring from backup..."
gunzip -c ${BACKUP_FILE} | psql -h ${PGHOST} -U ${PGUSER} -d ${PGDATABASE}

if [ $? -eq 0 ]; then
    echo "Database restored successfully from ${BACKUP_FILE}"
else
    echo "Restore failed!"
    exit 1
fi

echo "Restore process completed at $(date)"
