#!/bin/bash

# use pg_dump to create a backup of the database
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="facefusion"
DB_USER="postgres"
DB_PASSWORD="William1!"

PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > facefusion_backup.sql
if [ $? -eq 0 ]; then
    echo "Database backup created successfully: facefusion_backup.sql"
else
    echo "Error creating database backup."
    exit 1
fi


# Supabase database connection details
# postgresql://postgres:[YOUR-PASSWORD]@db.vrwpcukrazrkpdlrdqhx.supabase.co:5432/postgres
# psql -h db.vrwpcukrazrkpdlrdqhx.supabase.co -p 5432 -d postgres -U postgres
host="db.vrwpcukrazrkpdlrdqhx.supabase.co"
port=5432
database=postgres
user=postgres
password="William1!"

echo "Restoring backup to Supabase database..."
PGPASSWORD=$password psql -h $host -p $port -U $user -d $database -f facefusion_backup.sql
if [ $? -eq 0 ]; then
    echo "Database restored into Supabase successfully."
else
    echo "Error restoring database into Supabase."
    exit 1
fi
