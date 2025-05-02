/*
  Warnings:

  - Added the required column `medecinId` to the `Seance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Seance" ADD COLUMN     "medecinId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
