# Next.js with Prisma and PostgreSQL Example

This guide walks through setting up a Next.js application with Prisma ORM and PostgreSQL. We'll create a simple blog application with user authentication and post management.

## Project Setup

First, let's create a new Next.js project:

```bash
# Create a new Next.js app
npx create-next-app@latest my-blog
cd my-blog

# Install dependencies
npm install @prisma/client
npm install prisma --save-dev
```

## Initialize Prisma

```bash
npx prisma init
```

This will create a `prisma` directory with a `schema.prisma` file and a `.env` file.

## Setup PostgreSQL Database

Update the `.env` file with your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/my-blog?schema=public"
```

## Define Prisma Schema

Edit the `prisma/schema.prisma` file:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Generate Prisma Client and Run Migrations

```bash
# Create a migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### OpenCloudOS@15

```bash
sudo yum install postgresql-server postgresql

sudo postgresql-setup --initdb

sudo systemctl start postgresql
sudo systemctl enable postgresql
```

