#!/bin/bash

# Simple script to check database statistics from all database connections
# Usage: ./db-status.sh [all|local|neon|prisma]

# Directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default connection type
CONN_TYPE=${1:-all}

# Check if the more detailed script exists
if [ ! -f "$SCRIPT_DIR/check-all-dbs.sh" ]; then
    echo "Error: check-all-dbs.sh script not found"
    exit 1
fi

# Make sure the script is executable
chmod +x "$SCRIPT_DIR/check-all-dbs.sh"

# Run the more detailed script with options based on argument
case "$CONN_TYPE" in
    local)
        echo "Checking LOCAL database status..."
        # Extract LOCAL_DATABASE_URL from .env and use it
        source <(grep "LOCAL_DATABASE_URL" "$(dirname "$(dirname "$SCRIPT_DIR")")/.env")
        DATABASE_URL="$LOCAL_DATABASE_URL" "$SCRIPT_DIR/check-all-dbs.sh" | grep -A 50 "LOCAL" | grep -B 50 "Database checks completed"
        ;;
    neon)
        echo "Checking NEON database status..."
        # Extract NEON_DATABASE_URL from .env and use it
        source <(grep -E "(NEON_DATABASE_URL|DATABASE_URL)" "$(dirname "$(dirname "$SCRIPT_DIR")")/.env")
        if [ -n "$NEON_DATABASE_URL" ]; then
            DATABASE_URL="$NEON_DATABASE_URL" "$SCRIPT_DIR/check-all-dbs.sh" | grep -A 50 "NEON" | grep -B 50 "Database checks completed"
        else
            "$SCRIPT_DIR/check-all-dbs.sh" | grep -A 50 "NEON" | grep -B 50 "Database checks completed"
        fi
        ;;
    prisma)
        echo "Checking PRISMA database status..."
        # We can only show info since we can't directly query Prisma Accelerate
        "$SCRIPT_DIR/check-all-dbs.sh" | grep -A 20 "PRISMA"
        echo "Note: For more detailed information, check the underlying Neon database status."
        ;;
    all|*)
        echo "Checking ALL database connections..."
        "$SCRIPT_DIR/check-all-dbs.sh"
        ;;
esac

exit 0
