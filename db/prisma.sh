#!/bin/bash

# This script runs Prisma commands to generate client and migrate the database
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Uncomment the following line if you want to run the Prisma Studio
npx prisma studio
echo "Prisma commands executed successfully."
