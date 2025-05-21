#!/bin/bash

# Script to check database statistics for all three database connections
# This enhanced version properly handles environment variables with special characters

# Directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Root directory of the project
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
# Path to .env file
ENV_FILE="$PROJECT_ROOT/.env"

# Function to safely load environment variables from .env file
load_env() {
    if [ ! -f "$ENV_FILE" ]; then
        echo "Error: .env file not found at $ENV_FILE"
        return 1
    fi
    
    # Read environment variables without executing them
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^#.* ]] && continue
        
        # Extract variable name and value
        if [[ "$line" =~ ^([A-Za-z0-9_]+)=(.*)$ ]]; then
            varname="${BASH_REMATCH[1]}"
            varvalue="${BASH_REMATCH[2]}"
            
            # Remove surrounding quotes if present
            if [[ "$varvalue" =~ ^\"(.*)\"$ || "$varvalue" =~ ^\'(.*)\'$ ]]; then
                varvalue="${BASH_REMATCH[1]}"
            fi
            
            # Export the variable
            export "$varname"="$varvalue"
        fi
    done < "$ENV_FILE"
    
    return 0
}

# Load environment variables
echo "Loading environment variables from $ENV_FILE"
if ! load_env; then
    exit 1
fi

# Tables to check
TABLES=("User" "TargetTemplate" "FaceSource" "GeneratedMedia" "Guideline" "Payment")

# Function to extract connection parameters from a PostgreSQL URL
parse_postgres_url() {
    local url=$1
    
    # Handle URL format: postgresql://username:password@hostname:port/database?params
    if [[ "$url" =~ postgresql://([^:]+):([^@]+)@([^:/]+):?([0-9]*)/([^?]+) ]]; then
        local username="${BASH_REMATCH[1]}"
        local password="${BASH_REMATCH[2]}"
        local host="${BASH_REMATCH[3]}"
        local port="${BASH_REMATCH[4]}"
        local dbname="${BASH_REMATCH[5]}"
        
        # Default PostgreSQL port if not specified
        if [ -z "$port" ]; then
            port="5432"
        fi
        
        echo "$host|$port|$dbname|$username|$password"
    else
        echo "Invalid PostgreSQL URL format"
        return 1
    fi
}

# Function to execute query and format output
execute_query() {
    local conn_type=$1
    local host=$2
    local port=$3
    local dbname=$4
    local user=$5
    local password=$6
    local table=$7

    echo -n "[$conn_type] $table: "
    
    # For PostgreSQL connections
    if [[ $conn_type != "PRISMA" ]]; then
        PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$dbname" -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null || echo "Error: Could not connect or table doesn't exist"
    else
        # For Prisma Accelerate, we can't directly query it
        echo "Not directly queryable via psql (Prisma Accelerate)"
    fi
}

# Function to check database statistics
check_database() {
    local conn_type=$1
    local conn_url=$2
    
    echo "=========================================="
    echo "Database Statistics: $conn_type"
    echo "URL: ${conn_url:0:40}..."
    echo "=========================================="
    
    # Skip Prisma Accelerate for direct psql queries
    if [[ $conn_type == "PRISMA" ]]; then
        echo "Note: Prisma Accelerate can't be queried directly with psql."
        echo "It uses the underlying database (Neon in this case)."
        echo "=========================================="
        return
    fi
    
    # Parse connection URL
    local conn_params=$(parse_postgres_url "$conn_url")
    
    # Check if parsing was successful
    if [[ "$conn_params" == "Invalid PostgreSQL URL format" ]]; then
        echo "Error: Failed to parse connection URL"
        echo "=========================================="
        return
    fi
    
    local host=$(echo "$conn_params" | cut -d'|' -f1)
    local port=$(echo "$conn_params" | cut -d'|' -f2)
    local dbname=$(echo "$conn_params" | cut -d'|' -f3)
    local user=$(echo "$conn_params" | cut -d'|' -f4)
    local password=$(echo "$conn_params" | cut -d'|' -f5)
    
    # Check connection
    echo "Trying to connect to: $host:$port/$dbname as $user"
    if ! PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$dbname" -c "SELECT 1;" >/dev/null 2>&1; then
        echo "Error: Could not connect to $conn_type database"
        echo "=========================================="
        return
    fi
    
    echo "Connection successful!"
    echo "------------------------------------------"
    
    # Query each table
    for table in "${TABLES[@]}"; do
        execute_query "$conn_type" "$host" "$port" "$dbname" "$user" "$password" "$table"
    done
    
    # Check for _prisma_migrations table to verify migrations
    echo "------------------------------------------"
    echo -n "Migration status (_prisma_migrations): "
    PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$dbname" -t -c "SELECT COUNT(*) FROM _prisma_migrations;" 2>/dev/null || echo "No migrations applied"
    
    echo "=========================================="
}

# Check Local Database
if [ -n "$LOCAL_DATABASE_URL" ]; then
  check_database "LOCAL" "$LOCAL_DATABASE_URL"
else
  echo "LOCAL_DATABASE_URL not found in .env file"
fi

# Check Neon Database
if [ -n "$NEON_DATABASE_URL" ]; then
  check_database "NEON" "$NEON_DATABASE_URL"
elif [ -n "$DATABASE_URL" ]; then
  check_database "NEON (DATABASE_URL)" "$DATABASE_URL"
else
  echo "NEON_DATABASE_URL not found in .env file"
fi

# Note about Prisma Accelerate
if [ -n "$PRISMA_DATABASE_URL" ]; then
  check_database "PRISMA" "$PRISMA_DATABASE_URL"
else
  echo "PRISMA_DATABASE_URL not found in .env file"
fi

echo "Database checks completed."
