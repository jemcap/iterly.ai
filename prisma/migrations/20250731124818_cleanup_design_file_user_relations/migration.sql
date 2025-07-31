/*
  Warnings:

  - You are about to drop the column `userId` on the `design_files` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "design_files" DROP CONSTRAINT "design_files_userId_fkey";

-- AlterTable
ALTER TABLE "design_files" DROP COLUMN "userId";
