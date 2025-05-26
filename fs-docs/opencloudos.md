# OpenCloudOS

### 🌶 PostgreSQL@15

```bash
$ sudo yum install postgresql-server postgresql

$ sudo postgresql-setup --initdb

$ sudo systemctl start postgresql
$ sudo systemctl enable postgresql
```

### 🥕 psql

```bash
$ sudo -i -u postgres # su - postgres, sudo su - postgres
$ psql
> ALTER USER postgres WITH PASSWORD 'your-password';
```

```bash
$ sudo firewall-cmd --add-service=postgresql --permanent
$ sudo firewall-cmd --reload

$ psql -U postgres -d facefusion -f prisma/full_init_migration.sql
$ npx prisma init
$ npx prisma db push

$ vi /var/lib/pgsql/data/pg_hba.conf
$ sudo systemctl restart postgresql
```

### ▶️ Start the app with PM2

```bash
$ PORT=8000 pm2 start npm --name face-swap-app -- run dev
$ pm2 start npm --name "face-swap-app" -- run start
$ pm2 status
$ pm2 logs face-swap-app

$ pm2 save
$ pm2 restart face-swap-app
$ pm2 stop face-swap-app
$ pm2 delete face-swap-app
```

### 🥃 Neon

- `Serverless PostgreSQL`: Neon offers a fully managed serverless PostgreSQL service optimized for Prisma.
- `Free tier`: Neon has a generous free tier that includes:
  - 1 project
  - Up to 10 branches
  - 3 GiB storage
  - Shared compute with auto-scaling capabilities
- `Seamless Prisma integration`: Neon works extremely well with Prisma
- `Modern interface`: Easy to use web console for managing your database
- `SQL Editor`: Built-in SQL editor for running queries directly
- `Branching capabilities`: You can create database branches for development/testing

```bash
connecting str: postgresql://facefusion_owner:npg_qyrR70xpZhQa@ep-jolly-credit-a64vj2lz-pooler.us-west-2.aws.neon.tech/facefusion?sslmode=require
```

### 🥃 Prisma

````bash
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMDFKVlI1RU01TlowTVlCWjZGS1M1N0RYQjMiLCJ0ZW5hbnRfaWQiOiIxNTk0YWRhNzgxZjg5Y2FjOWRkOWY1Yjg4NmYwMjliMzYyNzllZDg3MmFiNTAxNDM1MmFkOGM1YzU4MTA1NjhjIiwiaW50ZXJuYWxfc2VjcmV0IjoiNTg4NmJlNTYtOGNkOS00MGViLTgwMDUtMzcwYzg2NzcwMmU0In0.39sjBPsbEmF66e71_n21wa8N5TzInQjufF16vmjeEyg"
```

### 🥃 Supabase

- PostgreSQL, PostgREST, `https://<project_ref>.supabase.co/rest/v1/`

### 🥕 scp

```bash
$ scp -r ~/my-experiments/face-swap-poc/storage nextjs@43.135.142.221:/home/nextjs/face-swap-poc/
```

### 🥕 github (ssh key -> git@)

1. `ssh-keygen -t ed25519 -C "williamjxj@hotmail.com"`, add to github
2. `github` -> `settings` -> `Developer Mode` -> `generate password` for `git push` (`git config --list`)
3. change `git remote -v` from `https` to `git`, then no password prompt anymore

```bash
$ ssh -T git@github.com
```

### nginx

```bash
$ nginx -T
$ sudo systemctl resrt nginx
```
````
