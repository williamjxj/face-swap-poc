#!/bin/bash

# Database connection parameters
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="facefusion"
DB_USER="postgres"
DB_PASSWORD="William1!"

# Set PGPASSWORD environment variable and connect
export PGPASSWORD="$DB_PASSWORD"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

# Unset password from environment for security
unset PGPASSWORD
