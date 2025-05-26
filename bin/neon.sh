#!/bin/bash

# connect neon postgres db facefusion using .env NEON_DATABASE_URL

source "$(dirname "$0")/config.sh"

echo "[NEON] Connecting to Neon PostgreSQL database at ${NEON_DATABASE_URL}"
psql "${NEON_DATABASE_URL}" -c "SELECT 'Connected to Neon PostgreSQL database successfully!' AS status"
if [ $? -ne 0 ]; then
    echo "[NEON ERROR] Failed to connect to Neon PostgreSQL database."
    exit 1
fi
echo "[NEON] Successfully connected to Neon PostgreSQL database."

# List all tables in the database
psql "${NEON_DATABASE_URL}" -c "\dt"
if [ $? -ne 0 ]; then
    echo "[NEON ERROR] Failed to list tables in Neon PostgreSQL database."
    exit 1
fi
echo "[NEON] Listed all tables in the Neon PostgreSQL database."

# Run a sample query to test the connection
psql "${NEON_DATABASE_URL}" -c "SELECT * FROM 'GeneratedMedia' LIMIT 5"
if [ $? -ne 0 ]; then
    echo "[NEON ERROR] Failed to run sample query on Neon PostgreSQL database."
    exit 1
fi
echo "[NEON] Successfully ran sample query on Neon PostgreSQL database."
