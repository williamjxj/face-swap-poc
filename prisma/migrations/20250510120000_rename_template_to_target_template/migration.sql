-- First, drop the existing foreign key constraints
ALTER TABLE "GeneratedMedia" 
  DROP CONSTRAINT IF EXISTS "GeneratedMedia_templateId_fkey";

ALTER TABLE "FaceSwap" 
  DROP CONSTRAINT IF EXISTS "FaceSwap_templateId_fkey";

-- Rename the table
ALTER TABLE "Template" RENAME TO "TargetTemplate";

-- Rename the columns
ALTER TABLE "GeneratedMedia" 
  RENAME COLUMN "template_id" TO "target_template_id";

ALTER TABLE "FaceSwap" 
  RENAME COLUMN "template_id" TO "target_template_id";

-- Recreate the foreign key constraints
ALTER TABLE "GeneratedMedia"
  ADD CONSTRAINT "GeneratedMedia_targetTemplateId_fkey"
  FOREIGN KEY ("target_template_id")
  REFERENCES "TargetTemplate"("id")
  ON DELETE SET NULL;

ALTER TABLE "FaceSwap"
  ADD CONSTRAINT "FaceSwap_targetTemplateId_fkey"
  FOREIGN KEY ("target_template_id")
  REFERENCES "TargetTemplate"("id")
  ON DELETE SET NULL;

-- Update the indexes (these will error if the index does not exist, but that's ok for migration)
ALTER INDEX "Template_pkey" RENAME TO "TargetTemplate_pkey";
ALTER INDEX "Template_authorId_idx" RENAME TO "TargetTemplate_authorId_idx"; 