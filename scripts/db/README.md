# Database Management Scripts

This directory contains scripts for managing and checking the status of your database connections.

## Available Scripts

### `check-all-dbs.sh`

This is a comprehensive script that checks the status of all database connections defined in your `.env` file. It will:

1. Connect to each database
2. Report connection status
3. Count records in each table
4. Check migration status

### `db-status.sh`

A simpler script that provides a quick overview of database status. It has the following options:

```bash
./db-status.sh [all|local|neon|prisma]
```

- `all`: Check all database connections (default)
- `local`: Check only the local database
- `neon`: Check only the Neon cloud database
- `prisma`: Show Prisma Accelerate information

### `db-stats.sh`

The original script for checking local database statistics.

## Database Connections

Your application has three database connections configured:

1. **Local Database**
   - Connection string: `LOCAL_DATABASE_URL`
   - Used for local development
   - PostgreSQL running on localhost

2. **Neon Cloud Database**
   - Connection string: `DATABASE_URL` and `NEON_DATABASE_URL`
   - Serverless PostgreSQL hosted in the cloud
   - Production-ready with automatic scaling

3. **Prisma Accelerate**
   - Connection string: `PRISMA_DATABASE_URL`
   - Connection pooling and caching layer
   - Improves performance of database connections
   - Uses Neon as the underlying database

## Migrating Data

To migrate your schema to any of these databases:

```bash
# For the default database (DATABASE_URL)
npx prisma migrate deploy

# For a specific database
DATABASE_URL=your_connection_string npx prisma migrate deploy
```

## Checking Table Data

To check the data in a specific table:

```bash
# Replace TABLE_NAME with your table name (User, TargetTemplate, etc.)
psql "your_connection_string" -c "SELECT * FROM \"TABLE_NAME\" LIMIT 10;"
```

## Common Issues

1. **No tables found**: Run migrations with `npx prisma migrate deploy`
2. **Connection failures**: Check VPN settings or network restrictions
3. **Missing data**: Make sure you're connecting to the right database
