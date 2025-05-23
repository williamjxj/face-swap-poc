#!/bin/bash

# Database connection parameters
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="facefusion"
DB_USER="postgres"
DB_PASSWORD="William1!"

# Function to execute query and format output
execute_query() {
    local table=$1
    echo "Table: $table"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM \"$table\";"
    echo "----------------------------------------"
}

echo "Database Statistics"
echo "======================================"

# Query each table
execute_query "User"
execute_query "TargetTemplate"
execute_query "FaceSource"
execute_query "GeneratedMedia"
execute_query "Guideline"

echo "Query completed."