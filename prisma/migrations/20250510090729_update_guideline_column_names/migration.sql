/*
  Warnings:

  - You are about to drop the column `is_active` on the `Guideline` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail_path` on the `Guideline` table. All the data in the column will be lost.
  - Added the required column `file_path` to the `Guideline` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- First rename thumbnail_path to file_path
ALTER TABLE "Guideline" RENAME COLUMN "thumbnail_path" TO "file_path";

-- Then rename is_active to is_allowed
ALTER TABLE "Guideline" RENAME COLUMN "is_active" TO "is_allowed";
