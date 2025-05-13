```bash
$ sudo -i -u postgres
$ su - postgres
$ sudo su - postgres
$ psql
> ALTER USER postgres WITH PASSWORD 'your-password';
```

```bash
$ sudo systemctl restart postgresql
$ sudo firewall-cmd --add-service=postgresql --permanent
$ sudo firewall-cmd --reload

$ psql -U postgres -d facefusion -f prisma/full_init_migration.sql 
$ npx prisma init
DATABASE_URL="postgresql://<db_user>:<password>@<host>:<port>/<db_name>"

$ vi /var/lib/pgsql/data/pg_hba.conf
$ sudo systemctl restart postgresql
```

### Prisma

| Step | Command/Action | 
| --- | --- |
| Run SQL initialization | `psql -U postgres -d facefusion -f init.sql` |
| Initialize Prisma | `npx prisma init`: prisma/schema.prisma, .env |
| configure | DATABASE_URL="postgresql://<db_user>:<password>@<host>:<port>/<db_name>" |
| Introspect db | `npx prisma db pull` |
| Generate client | `npx prisma generate` |

```bash
scp -r ~/my-experiments/face-swap-poc/storage nextjs@43.135.142.221:/home/nextjs/face-swap-poc/
```

### TODO

- fileSize is bigInt, needs serializeBigInt process

