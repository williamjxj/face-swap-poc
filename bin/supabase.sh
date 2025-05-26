#!/bin/bash

# use pg_dump to create a backup of the database
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="facefusion"
DB_USER="postgres"
DB_PASSWORD="William1!"

pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > facefusion_backup.sql
if [ $? -eq 0 ]; then
    echo "Database backup created successfully: facefusion_backup.sql"
else
    echo "Error creating database backup."
    exit 1
fi

# use pg_restore to restore the database into Supabase from the backup
# Supabase settings are in .env (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env | cut -d '=' -f2)
SUPABASE_ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env | cut -d '=' -f2)
pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --no-owner --no-acl --if-exists facefusion_backup.sql
if [ $? -eq 0 ]; then
    echo "Database restored into Supabase successfully."
else
    echo "Error restoring database into Supabase."
    exit 1
fi

