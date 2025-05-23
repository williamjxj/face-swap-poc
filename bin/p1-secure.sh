#!/bin/bash

# This script connects to the facefusion database using a password stored in the script
# IMPORTANT: This script contains the database password, so keep it secure!

# Database connection parameters
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="facefusion"
DB_USER="postgres"
DB_PASSWORD="William1!" # Replace with your actual password

# Set PGPASSWORD environment variable and connect
export PGPASSWORD="$DB_PASSWORD"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

# Unset password from environment for security
unset PGPASSWORD
