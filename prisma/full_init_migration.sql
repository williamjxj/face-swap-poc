-- Full database initialization SQL for PostgreSQL
-- Generated from schema.prisma

-- Create tables
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "account" TEXT NOT NULL UNIQUE,
    "last_login" TIMESTAMP,
    "last_logout" TIMESTAMP
);

CREATE TABLE "TargetTemplate" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "filename" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "file_size" BIGINT NOT NULL,
    "duration" INTEGER,
    "mime_type" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE "FaceSource" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "filename" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP,
    "author_id" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE "GeneratedMedia" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "temp_path" TEXT,
    "file_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "file_size" BIGINT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id" TEXT,
    "is_purchased" BOOLEAN NOT NULL DEFAULT false,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "template_id" TEXT,
    "face_source_id" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "watermark_path" TEXT,
    FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE SET NULL,
    FOREIGN KEY ("template_id") REFERENCES "TargetTemplate"("id") ON DELETE SET NULL,
    FOREIGN KEY ("face_source_id") REFERENCES "FaceSource"("id") ON DELETE SET NULL
);

CREATE TABLE "Guideline" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "filename" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "file_path" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_allowed" BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes
CREATE INDEX "TargetTemplate_author_id_idx" ON "TargetTemplate"("author_id");
CREATE INDEX "FaceSource_author_id_idx" ON "FaceSource"("author_id");
CREATE INDEX "GeneratedMedia_author_id_idx" ON "GeneratedMedia"("author_id");
CREATE INDEX "GeneratedMedia_template_id_idx" ON "GeneratedMedia"("template_id");
CREATE INDEX "GeneratedMedia_face_source_id_idx" ON "GeneratedMedia"("face_source_id");
