# Database Management Scripts

This directory contains helpful scripts for managing your Prisma + Supabase integration.

## Available Scripts

### 🔄 `switch-db-env.sh`

Quickly switch between Local PostgreSQL and Remote Supabase configurations.

```bash
# Interactive mode
./scripts/switch-db-env.sh

# Direct commands
./scripts/switch-db-env.sh local      # Switch to Local PostgreSQL
./scripts/switch-db-env.sh supabase   # Switch to Remote Supabase
./scripts/switch-db-env.sh status     # Show current configuration
./scripts/switch-db-env.sh validate   # Validate current setup
```

### 🚀 `migrate-to-supabase.sh`

Migrate your local database to Supabase with schema and data.

```bash
# Full migration
./scripts/migrate-to-supabase.sh

# Partial operations
./scripts/migrate-to-supabase.sh export-only   # Only export local data
./scripts/migrate-to-supabase.sh import-only   # Only import to Supabase
./scripts/migrate-to-supabase.sh schema-only   # Only migrate schema
```

### 🔍 `verify-build.sh`

Verify your build configuration and test deployment readiness.

```bash
./scripts/verify-build.sh
```

## Quick Start Guide

### 1. Setup Local Development

```bash
# Switch to local PostgreSQL
./scripts/switch-db-env.sh local

# Start local development
npm run dev:local
```

### 2. Switch to Supabase

```bash
# Switch to Supabase configuration
./scripts/switch-db-env.sh supabase

# Update credentials in .env.local
# Then start development
npm run dev:cloud
```

### 3. Migrate to Supabase

```bash
# Run full migration
./scripts/migrate-to-supabase.sh

# Follow the prompts to complete migration
```

### 4. Deploy to Vercel

```bash
# Verify build works
./scripts/verify-build.sh

# Follow deployment checklist
# See: docs/VERCEL_DEPLOYMENT_CHECKLIST.md
```

## Prerequisites

- Node.js and npm installed
- PostgreSQL client tools (psql, pg_dump)
- Prisma CLI available globally or via npx
- Proper .env.local configuration

## File Structure After Scripts

```
project/
├── .env.local                    # Current environment config
├── .env.local.backup.*          # Automatic backups
├── backups/                     # Migration backups
│   ├── schema_[timestamp].sql   # Database schema export
│   ├── data_[timestamp].sql     # Database data export
│   └── latest_export.env        # Latest export info
└── scripts/                     # This directory
```

## Environment Variables

The scripts manage these key variables:

```bash
# Database Connection
DATABASE_URL="postgresql://..."

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# OAuth Providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

## Troubleshooting

### Script Permission Issues

```bash
chmod +x scripts/*.sh
```

### Database Connection Issues

```bash
# Test current configuration
./scripts/switch-db-env.sh validate

# Check environment variables
cat .env.local | grep DATABASE_URL
```

### Migration Issues

```bash
# Reset Prisma state
npx prisma migrate reset

# Regenerate client
npx prisma generate

# Re-run migration
./scripts/migrate-to-supabase.sh
```

## Support

- **Documentation**: See `docs/` directory for detailed guides
- **Issues**: Check troubleshooting sections in documentation
- **Configuration**: Verify environment variables are correct

Happy developing! 🚀
