# 💾 Database Schema Design

This document outlines the database schema design for the Face Swap POC application using Prisma ORM with PostgreSQL and Supabase.

## 🏗️ Schema Overview

The application uses a relational database design with the following core entities:

- **Users** - Authentication and user profiles
- **Face Sources** - User-uploaded face images
- **Target Templates** - Video/image templates for face swapping
- **Generated Videos** - Face-swapped output videos
- **Purchases** - Payment and transaction records

## 📋 Database Tables

### Users Table

```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String?
  image             String?
  emailVerified     DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  accounts          Account[]
  sessions          Session[]
  faceSources       FaceSource[]
  generatedVideos   GeneratedVideo[]
  purchases         Purchase[]

  @@map("users")
}
```

#### Purpose

- Stores user authentication and profile information
- Compatible with NextAuth.js user model
- Supports OAuth providers (Google, Microsoft)

#### Key Features

- **Unique email** constraint for authentication
- **Soft timestamps** for audit trails
- **Relations** to all user-owned content

### Face Sources Table

```prisma
model FaceSource {
  id          String   @id @default(cuid())
  userId      String
  filename    String
  originalName String?
  fileSize    Int?
  mimeType    String?
  uploadedAt  DateTime @default(now())
  isActive    Boolean  @default(true)

  // Relations
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  generatedVideos GeneratedVideo[]

  @@map("face_sources")
}
```

#### Purpose

- Stores user-uploaded face images for swapping
- Tracks file metadata and upload information

#### Key Features

- **Cascade delete** when user is deleted
- **File metadata** tracking (size, type, names)
- **Soft delete** capability with `isActive`
- **One-to-many** relation with generated videos

### Target Templates Table

```prisma
model TargetTemplate {
  id              String   @id @default(cuid())
  filename        String   @unique
  originalName    String?
  thumbnailPath   String?
  duration        String?
  fileSize        Int?
  mimeType        String?
  author          String?
  description     String?
  category        String?
  tags            String[] // Array of strings
  isActive        Boolean  @default(true)
  isFeatured      Boolean  @default(false)
  uploadedAt      DateTime @default(now())

  // Relations
  generatedVideos GeneratedVideo[]

  @@map("target_templates")
}
```

#### Purpose

- Stores available video/image templates for face swapping
- Managed by administrators, used by all users

#### Key Features

- **Unique filename** constraint
- **Metadata** including thumbnails, duration, categories
- **Tagging system** for categorization
- **Featured content** capability
- **File size tracking** for optimization

### Generated Videos Table

```prisma
model GeneratedVideo {
  id               String   @id @default(cuid())
  userId           String
  faceSourceId     String
  targetTemplateId String
  filename         String
  originalName     String?
  fileSize         Int?
  mimeType         String?
  duration         String?
  status           VideoStatus @default(PENDING)
  processingStarted DateTime?
  processingCompleted DateTime?
  errorMessage     String?
  outputPath       String? // For external API processing
  hasWatermark     Boolean  @default(true)
  createdAt        DateTime @default(now())

  // Relations
  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  faceSource     FaceSource     @relation(fields: [faceSourceId], references: [id])
  targetTemplate TargetTemplate @relation(fields: [targetTemplateId], references: [id])
  purchases      Purchase[]

  @@map("generated_videos")
}
```

## 🔧 Prisma Commands Reference

### Development Commands

```bash
# Initialize Prisma
npx prisma init

# Generate Prisma client
npx prisma generate

# Push schema changes (dev only)
npx prisma db push

# Create and apply migration
npx prisma migrate dev --name "migration_name"

# Open Prisma Studio
npx prisma studio

# Pull schema from existing database
npx prisma db pull
```

### Production Commands

```bash
# Deploy migrations to production
npx prisma migrate deploy

# Reset database (dangerous - dev only)
npx prisma migrate reset

# Validate migration files
npx prisma migrate diff --preview-feature
```

### Integration Workflow

| Step               | Command/Action                                                          |
| ------------------ | ----------------------------------------------------------------------- |
| 1. Initialize      | `npx prisma init`                                                       |
| 2. Configure       | Set `DATABASE_URL` in `.env`                                            |
| 3. Define Schema   | Edit `prisma/schema.prisma`                                             |
| 4. Generate Client | `npx prisma generate`                                                   |
| 5. Apply Changes   | `npx prisma db push` (dev) or `npx prisma migrate dev` (with migration) |
| 6. Deploy          | `npx prisma migrate deploy` (production)                                |

## 🛡️ Data Integrity and Security

### Constraints and Validations

- **Unique email** constraint for user authentication
- **File metadata** tracking for all uploads
- **Soft delete** capability via `isActive` flags
- **Cascade delete** for user-owned content
- **UUID-based IDs** for uniqueness across distributed systems

### Performance Considerations

- **Indexing** on frequently queried fields
- **File size tracking** for storage optimization
- **Status-based queries** for processing workflows
- **Time-based indexes** for audit and analytics

## 📚 Related Documentation

- [migration-notes.md](./migration-notes.md) - Migration procedures and history
- [backup-strategy.md](./backup-strategy.md) - Backup and recovery procedures
- [../PRISMA_SUPABASE_INTEGRATION.md](../PRISMA_SUPABASE_INTEGRATION.md) - Integration guide

---

**Note**: This schema design prioritizes data integrity, performance, and scalability while maintaining compatibility with NextAuth.js and Stripe integration requirements.
