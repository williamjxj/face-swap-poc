/*
  Warnings:

  - You are about to drop the column `description` on the `Guideline` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Guideline` table. All the data in the column will be lost.
  - Added the required column `file_size` to the `Guideline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_type` to the `Guideline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filename` to the `Guideline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `Guideline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `Guideline` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Guideline" DROP COLUMN "description",
DROP COLUMN "title",
ADD COLUMN     "file_size" BIGINT NOT NULL,
ADD COLUMN     "file_type" TEXT NOT NULL,
ADD COLUMN     "filename" TEXT NOT NULL,
ADD COLUMN     "height" INTEGER NOT NULL,
ADD COLUMN     "width" INTEGER NOT NULL;
