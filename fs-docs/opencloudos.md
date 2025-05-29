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

### 🥃 Prisma

`DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJ...eEyg"`

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
