#!/bin/bash

# This script connects to the facefusion database without prompting for a password
# Make sure you have set up a ~/.pgpass file with the following format:
# localhost:5432:facefusion:postgres:your_password
# And ensure it has the correct permissions with: chmod 600 ~/.pgpass

psql -h localhost -p 5432 -U postgres -d facefusion
