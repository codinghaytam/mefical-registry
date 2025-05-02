/*
  Warnings:

  - You are about to drop the column `idSeance` on the `Seance` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Seance_idSeance_key";

-- AlterTable
ALTER TABLE "Seance" DROP COLUMN "idSeance";
