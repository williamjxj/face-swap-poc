-- Update existing records to use filePath as thumbnailPath if thumbnailPath is null
UPDATE "GeneratedMedia"
SET "thumbnailPath" = "filePath"
WHERE "thumbnailPath" IS NULL; 