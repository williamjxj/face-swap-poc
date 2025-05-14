# OpenCloudOS

### 🌶 PostgreSQL@15

```bash
$ sudo yum install postgresql-server postgresql

$ sudo postgresql-setup --initdb

$ sudo systemctl start postgresql
$ sudo systemctl enable postgresql
```

### 🥕 Postgresql

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
DATABASE_URL="postgresql://<db_user>:<password>@<host>:<port>/<db_name>"

$ vi /var/lib/pgsql/data/pg_hba.conf
$ sudo systemctl restart postgresql
```

### ▶️ Start the app with PM2

```bash
$ pm2 start npm --name "face-swap-app" -- run start
$ pm2 start npm --name 'face-swap-app-dev' --run dev
$ pm2 status
$ pm2 logs face-swap-app

$ pm2 save
$ pm2 restart face-swap-app
$ pm2 stop face-swap-app
$ pm2 delete face-swap-app
```

### 🥃 Supabase

- PostgreSQL, PostgREST, `https://<project_ref>.supabase.co/rest/v1/`

### scp

```bash
$ scp -r ~/my-experiments/face-swap-poc/storage nextjs@43.135.142.221:/home/nextjs/face-swap-poc/
```
