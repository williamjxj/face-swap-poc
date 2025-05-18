### 🥬 DB Type: TEXT vs. VARCHAR

- file metadata
- All tables include soft delete capability via `is_active`
- Use UUID for all IDs to ensure uniqueness across potential distributed systems
- Implement proper indexing based on query patterns
- Consider implementing event tracking table for detailed usage analytics
- Implement proper file path validation and sanitization
- Ensure proper backup strategy for both database and file storage
- Implement migration strategy for future cloud storage transition

### 🥒 video2thumbnail

```html
<Image src="video2thumbnail.png" alt="video2thumbnail" width={116} height={176} />
```

### 🌶  npx prisma db push

- Directly applies schema changes to the database
- Does not generate migration files
- Ideal for rapid iteration in non-production environments


### 🌽 npx prisma migrate deploy

`$ npx prisma migrate dev --name <migration_name>`

- Creates migration files in `prisma/migrations`
- Applies changes to the database
- Generates/updates Prisma Client


### Prisma

| Step | Command/Action | 
| --- | --- |
| Run SQL initialization | `psql -U postgres -d facefusion -f init.sql` |
| Initialize Prisma | `npx prisma init`: prisma/schema.prisma, .env |
| configure | DATABASE_URL="postgresql://<db_user>:<password>@<host>:<port>/<db_name>" |
| Introspect db | `npx prisma db pull` |
| Generate client | `npx prisma generate` (sync schema) |


