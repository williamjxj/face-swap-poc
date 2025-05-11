/*
  Warnings:

  - You are about to drop the column `name` on the `FaceSource` table. All the data in the column will be lost.
  - Added the required column `filename` to the `FaceSource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `FaceSource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `FaceSource` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FaceSource" DROP COLUMN "name",
ADD COLUMN     "filename" TEXT NOT NULL,
ADD COLUMN     "height" INTEGER NOT NULL,
ADD COLUMN     "width" INTEGER NOT NULL;
