# 🔄 Database Migration Notes

This document tracks migration procedures, history, and best practices for the Face Swap POC database.

## 📊 Migration History

### Current Schema Version

- **Latest Migration**: `20241230_comprehensive_schema`
- **Database Version**: PostgreSQL 15+
- **Prisma Version**: 6.7.0+

### Migration Timeline

| Date       | Migration              | Description                                    | Status      |
| ---------- | ---------------------- | ---------------------------------------------- | ----------- |
| 2024-06-30 | `init_schema`          | Initial database setup with NextAuth.js tables | ✅ Complete |
| 2024-06-30 | `add_face_sources`     | User face upload functionality                 | ✅ Complete |
| 2024-06-30 | `add_target_templates` | Video template system                          | ✅ Complete |
| 2024-06-30 | `add_generated_videos` | Video generation tracking                      | ✅ Complete |
| 2024-06-30 | `add_purchases`        | Payment and purchase system                    | ✅ Complete |
| 2024-06-30 | `add_indexes`          | Performance optimization indexes               | ✅ Complete |

## 🔧 Migration Procedures

### Development Migration Workflow

```bash
# 1. Make schema changes in prisma/schema.prisma
# Example: Add new field to User model

# 2. Create and apply migration
npx prisma migrate dev --name "add_user_preferences"

# 3. Verify migration
npx prisma studio

# 4. Test application with new schema
npm run dev
```

### Production Migration Workflow

```bash
# 1. Backup current database
pg_dump $DATABASE_URL > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# 2. Deploy migration to production
npx prisma migrate deploy

# 3. Verify deployment
npx prisma migrate status

# 4. Test critical application functions
# 5. Monitor for issues
```

### Emergency Rollback Procedure

```bash
# 1. Stop application
# 2. Restore from backup
psql $DATABASE_URL < backup_pre_migration_YYYYMMDD_HHMMSS.sql

# 3. Revert migration files (if needed)
git revert <migration-commit>

# 4. Restart application with previous schema
```

## 🔀 Local to Cloud Migration

### From Local PostgreSQL to Supabase

This is the main migration scenario covered in detail in `../PRISMA_SUPABASE_INTEGRATION.md`.

#### Quick Reference Commands

```bash
# 1. Export local data
pg_dump $LOCAL_DATABASE_URL > local_export.sql

# 2. Clean and prepare data for Supabase
sed 's/your_local_schema/public/g' local_export.sql > supabase_import.sql

# 3. Import to Supabase
psql $SUPABASE_DATABASE_URL < supabase_import.sql

# 4. Update application configuration
./scripts/switch-db-env.sh remote

# 5. Verify migration
npm run build && npm run dev
```

### Migration Script Usage

The automated migration script handles the complete process:

```bash
# Run automated migration
./scripts/migrate-to-supabase.sh

# Interactive mode with confirmations
./scripts/migrate-to-supabase.sh --interactive

# Dry run (no actual changes)
./scripts/migrate-to-supabase.sh --dry-run
```

## 📋 Schema Change Patterns

### Adding New Tables

```prisma
// Example: Adding a new UserPreferences table
model UserPreferences {
  id         String  @id @default(cuid())
  userId     String  @unique
  theme      String  @default("light")
  language   String  @default("en")
  notifications Boolean @default(true)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}

// Add relation to User model
model User {
  // ...existing fields...
  preferences UserPreferences?
}
```

### Adding New Fields

```prisma
// Example: Adding optional fields to existing table
model GeneratedVideo {
  // ...existing fields...

  // New fields (always optional initially)
  thumbnailPath   String?
  processingNode  String?
  qualityScore    Float?

  // Add with default values to avoid migration issues
  createdAt DateTime @default(now()) // If not exists
}
```

### Modifying Existing Fields

```prisma
// Safe modifications (expanding constraints)
model User {
  // Expanding string length is safe
  name String? @db.VarChar(255) // from @db.VarChar(100)

  // Adding new enum values (append only)
  role UserRole @default(USER) // USER, ADMIN, PREMIUM (added PREMIUM)
}

// Unsafe modifications (require data migration)
// - Reducing field length
// - Changing data types
// - Making fields required
// - Removing enum values
```

## 🗂️ Migration Files Structure

```
prisma/
├── schema.prisma              # Current schema definition
└── migrations/
    ├── migration_lock.toml    # Migration lock file
    ├── 20240630120000_init/
    │   └── migration.sql      # Initial schema
    ├── 20240630130000_add_face_sources/
    │   └── migration.sql      # Face sources table
    ├── 20240630140000_add_target_templates/
    │   └── migration.sql      # Target templates table
    ├── 20240630150000_add_generated_videos/
    │   └── migration.sql      # Generated videos table
    ├── 20240630160000_add_purchases/
    │   └── migration.sql      # Purchases table
    └── 20240630170000_add_indexes/
        └── migration.sql      # Performance indexes
```

## 🔍 Migration Troubleshooting

### Common Issues and Solutions

#### 1. Migration Fails Due to Data Constraints

```bash
# Error: Cannot add NOT NULL column without default
# Solution: Add field as optional first, then make required in separate migration

# Step 1: Add optional field
npx prisma migrate dev --name "add_optional_field"

# Step 2: Populate field with data
psql $DATABASE_URL -c "UPDATE users SET new_field = 'default_value' WHERE new_field IS NULL;"

# Step 3: Make field required
npx prisma migrate dev --name "make_field_required"
```

#### 2. Schema Drift Detected

```bash
# Error: Schema drift detected
# Solution: Reset shadow database or fix drift

# Check current status
npx prisma migrate status

# Reset and reapply (development only)
npx prisma migrate reset

# Or resolve drift manually
npx prisma migrate resolve --applied "migration_name"
```

#### 3. Migration Hangs on Large Tables

```bash
# For large data migrations, use batched updates
# Example SQL for large table updates:
DO $$
DECLARE
    batch_size INTEGER := 1000;
    offset_val INTEGER := 0;
    rows_updated INTEGER;
BEGIN
    LOOP
        UPDATE generated_videos
        SET new_field = 'default_value'
        WHERE id IN (
            SELECT id FROM generated_videos
            WHERE new_field IS NULL
            LIMIT batch_size OFFSET offset_val
        );

        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        EXIT WHEN rows_updated = 0;

        offset_val := offset_val + batch_size;
        RAISE NOTICE 'Updated % rows, offset %', rows_updated, offset_val;
    END LOOP;
END $$;
```

### Migration Validation

```sql
-- Verify table structure
\d+ users
\d+ generated_videos

-- Check constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public';

-- Verify indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## 📊 Migration Performance

### Before Large Migrations

```bash
# 1. Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Check database size and performance
psql $DATABASE_URL -c "
SELECT
    pg_size_pretty(pg_database_size(current_database())) as db_size,
    count(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';
"

# 3. Identify large tables
psql $DATABASE_URL -c "
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY bytes DESC;
"
```

### Migration Monitoring

```bash
# Monitor migration progress (in separate terminal)
watch -n 5 'psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE state = \"active\";"'

# Check locks during migration
psql $DATABASE_URL -c "
SELECT
    pid,
    usename,
    application_name,
    state,
    query_start,
    query
FROM pg_stat_activity
WHERE state = 'active'
AND query NOT LIKE '%pg_stat_activity%';
"
```

## 📚 Related Documentation

- [schema-design.md](./schema-design.md) - Database schema overview
- [backup-strategy.md](./backup-strategy.md) - Backup and recovery procedures
- [../PRISMA_SUPABASE_INTEGRATION.md](../PRISMA_SUPABASE_INTEGRATION.md) - Complete migration guide
- [../scripts/README.md](../../scripts/README.md) - Migration scripts documentation

---

**Note**: Always test migrations in a staging environment before applying to production. Keep detailed logs of all migration activities for audit and troubleshooting purposes.
