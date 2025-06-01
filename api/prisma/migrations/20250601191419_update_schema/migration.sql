/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Store` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Store" DROP CONSTRAINT "Store_ownerId_fkey";

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "ownerId";
