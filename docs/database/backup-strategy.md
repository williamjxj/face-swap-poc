# 💾 Backup and Recovery Strategy

This document outlines backup strategies, recovery procedures, and data protection measures for the Face Swap POC application.

## 🛡️ Backup Strategy Overview

### Multi-Tier Backup Approach

1. **Database Backups** - PostgreSQL/Supabase data
2. **File Storage Backups** - User uploads and generated content
3. **Configuration Backups** - Environment variables and configurations
4. **Code Backups** - Git repository and deployment artifacts

## 📊 Database Backup Strategy

### Supabase Automatic Backups

Supabase provides automatic backup features:

- **Point-in-time recovery** (PITR) - 7 days for free tier, 30 days for paid plans
- **Daily snapshots** - Automatic daily backups
- **Manual snapshots** - On-demand backup creation

#### Accessing Supabase Backups

```bash
# View available backups in Supabase Dashboard
# Settings → Database → Backups

# Create manual backup
# Dashboard → Database → Backups → Create backup
```

### Manual Database Backups

#### Local PostgreSQL Backup

```bash
# Full database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Schema-only backup
pg_dump --schema-only $DATABASE_URL > schema_backup_$(date +%Y%m%d_%H%M%S).sql

# Data-only backup
pg_dump --data-only $DATABASE_URL > data_backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Supabase Database Backup

```bash
# Using pg_dump with Supabase
pg_dump "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" > supabase_backup.sql

# Using Supabase CLI (if available)
supabase db dump -f backup.sql
```

### Automated Backup Scripts

#### Daily Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

# Configuration
BACKUP_DIR="/Users/william.jiang/my-playgrounds/face-swap-poc/backups"
DATABASE_URL="${DATABASE_URL}"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup
echo "Creating database backup..."
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE
echo "Backup created: $BACKUP_FILE.gz"

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Old backups cleaned (older than $RETENTION_DAYS days)"

# Verify backup
gunzip -t $BACKUP_FILE.gz
if [ $? -eq 0 ]; then
    echo "Backup verification: SUCCESS"
else
    echo "Backup verification: FAILED"
    exit 1
fi
```

#### Weekly Schema Backup

```bash
#!/bin/bash
# scripts/backup-schema.sh

SCHEMA_DIR="/Users/william.jiang/my-playgrounds/face-swap-poc/backups/schema"
mkdir -p $SCHEMA_DIR

TIMESTAMP=$(date +%Y%m%d)
SCHEMA_FILE="$SCHEMA_DIR/schema_$TIMESTAMP.sql"

# Backup schema only
pg_dump --schema-only $DATABASE_URL > $SCHEMA_FILE

# Also backup current Prisma schema
cp prisma/schema.prisma $SCHEMA_DIR/prisma_schema_$TIMESTAMP.prisma

echo "Schema backup created: $SCHEMA_FILE"
```

## 🗂️ File Storage Backup Strategy

### User Uploads and Generated Content

```bash
#!/bin/bash
# scripts/backup-storage.sh

STORAGE_DIR="/Users/william.jiang/my-playgrounds/face-swap-poc/storage"
BACKUP_DIR="/Users/william.jiang/my-playgrounds/face-swap-poc/backups/storage"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create storage backup
tar -czf $BACKUP_DIR/storage_backup_$TIMESTAMP.tar.gz $STORAGE_DIR

# Sync to cloud storage (example with rsync)
# rsync -av $STORAGE_DIR/ user@backup-server:/backups/storage/

echo "Storage backup created: storage_backup_$TIMESTAMP.tar.gz"
```

### Public Assets Backup

```bash
#!/bin/bash
# scripts/backup-public-assets.sh

PUBLIC_DIR="/Users/william.jiang/my-playgrounds/face-swap-poc/public"
BACKUP_DIR="/Users/william.jiang/my-playgrounds/face-swap-poc/backups/public"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup public assets
tar -czf $BACKUP_DIR/public_backup_$TIMESTAMP.tar.gz $PUBLIC_DIR

echo "Public assets backup created: public_backup_$TIMESTAMP.tar.gz"
```

## 🔄 Recovery Procedures

### Database Recovery

#### Full Database Restore

```bash
# Stop application
# Ensure no connections to database

# Restore from backup
psql $DATABASE_URL < backup_20240630_120000.sql

# Or restore from compressed backup
gunzip -c backup_20240630_120000.sql.gz | psql $DATABASE_URL

# Regenerate Prisma client
npx prisma generate

# Restart application
npm run start
```

#### Point-in-Time Recovery (Supabase)

```bash
# Using Supabase Dashboard:
# 1. Go to Settings → Database → Backups
# 2. Select point-in-time recovery
# 3. Choose specific timestamp
# 4. Create new database or restore to existing

# Update DATABASE_URL if new database created
# Regenerate Prisma client
npx prisma generate
```

#### Partial Data Recovery

```bash
# Restore specific tables only
pg_restore -t users -t generated_videos backup.sql

# Restore data for specific date range
psql $DATABASE_URL -c "
DELETE FROM generated_videos WHERE created_at > '2024-06-30 12:00:00';
"
# Then restore from backup with specific data
```

### File Storage Recovery

#### Restore User Files

```bash
# Extract storage backup
tar -xzf storage_backup_20240630_120000.tar.gz

# Copy to application directory
cp -r storage/* /Users/william.jiang/my-playgrounds/face-swap-poc/storage/

# Fix permissions
chmod -R 755 /Users/william.jiang/my-playgrounds/face-swap-poc/storage/
```

#### Restore Specific File Types

```bash
# Restore only face sources
tar -xzf storage_backup.tar.gz --wildcards "*/face-sources/*"

# Restore only generated outputs
tar -xzf storage_backup.tar.gz --wildcards "*/generated-outputs/*"
```

## 🚨 Emergency Recovery Procedures

### Critical Data Loss Scenario

```bash
# 1. Immediate Response
# - Stop all write operations to database
# - Preserve current state for investigation
# - Notify stakeholders

# 2. Assessment
# - Identify scope of data loss
# - Determine best recovery point
# - Check backup integrity

# 3. Recovery Execution
# - Create current state backup (even if corrupted)
pg_dump $DATABASE_URL > emergency_state_$(date +%Y%m%d_%H%M%S).sql

# - Restore from latest good backup
psql $DATABASE_URL < backup_last_known_good.sql

# - Verify data integrity
npm run verify-data-integrity

# 4. Post-Recovery
# - Test all critical functions
# - Notify users of any data loss
# - Implement additional safeguards
```

### Corruption Recovery

```bash
# Database corruption detection
psql $DATABASE_URL -c "SELECT pg_database_size(current_database());"

# Check for corruption
psql $DATABASE_URL -c "VACUUM FULL VERBOSE;"

# If corruption found, restore from backup
# Follow standard recovery procedures
```

## 📋 Backup Verification

### Automated Verification Script

```bash
#!/bin/bash
# scripts/verify-backup.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Test backup file integrity
if [ "${BACKUP_FILE##*.}" = "gz" ]; then
    gunzip -t $BACKUP_FILE
else
    head -n 10 $BACKUP_FILE > /dev/null
fi

if [ $? -eq 0 ]; then
    echo "✅ Backup file integrity: OK"
else
    echo "❌ Backup file integrity: FAILED"
    exit 1
fi

# Test restore to temporary database (if available)
# This would require a test database setup
echo "✅ Backup verification completed"
```

### Monthly Recovery Testing

```bash
#!/bin/bash
# scripts/test-recovery.sh

# Create test database
createdb test_recovery_$(date +%Y%m%d)

# Restore latest backup to test database
TEST_DB_URL="postgresql://localhost/test_recovery_$(date +%Y%m%d)"
psql $TEST_DB_URL < latest_backup.sql

# Run basic integrity checks
psql $TEST_DB_URL -c "SELECT count(*) FROM users;"
psql $TEST_DB_URL -c "SELECT count(*) FROM generated_videos;"

# Cleanup test database
dropdb test_recovery_$(date +%Y%m%d)

echo "✅ Recovery test completed successfully"
```

## 📊 Monitoring and Alerting

### Backup Health Monitoring

```bash
# Check backup file sizes (should be consistent)
ls -lh backups/backup_*.sql.gz | tail -5

# Alert if backup size varies significantly
# (Implement in monitoring system)
```

### Automated Alerts

```bash
# Example monitoring script
#!/bin/bash
# scripts/monitor-backups.sh

EXPECTED_BACKUP_COUNT=7  # Daily backups for 7 days
ACTUAL_BACKUP_COUNT=$(find backups/ -name "backup_*.sql.gz" -mtime -7 | wc -l)

if [ $ACTUAL_BACKUP_COUNT -lt $EXPECTED_BACKUP_COUNT ]; then
    echo "⚠️ Alert: Missing recent backups"
    # Send notification (email, Slack, etc.)
fi
```

## 🔐 Security Considerations

### Backup Encryption

```bash
# Encrypt sensitive backups
gpg --symmetric --cipher-algo AES256 backup.sql

# Decrypt when needed
gpg --decrypt backup.sql.gpg > backup.sql
```

### Secure Storage

```bash
# Upload encrypted backups to secure cloud storage
aws s3 cp backup.sql.gpg s3://secure-backup-bucket/

# Or use rsync with SSH
rsync -av --delete-after backups/ user@secure-server:/encrypted/backups/
```

### Access Control

```bash
# Restrict backup file permissions
chmod 600 backups/*.sql*

# Limit access to backup directory
chmod 700 backups/
```

## 📚 Related Documentation

- [schema-design.md](./schema-design.md) - Database schema overview
- [migration-notes.md](./migration-notes.md) - Migration procedures
- [../PRISMA_SUPABASE_INTEGRATION.md](../PRISMA_SUPABASE_INTEGRATION.md) - Database integration guide

---

**Note**: Test your backup and recovery procedures regularly. A backup is only as good as your ability to restore from it. Schedule monthly recovery drills to ensure your procedures work when needed.
