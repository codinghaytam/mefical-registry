/*
  Warnings:

  - You are about to drop the `_DiagnostiqueToMedecin` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_DiagnostiqueToMedecin" DROP CONSTRAINT "_DiagnostiqueToMedecin_A_fkey";

-- DropForeignKey
ALTER TABLE "_DiagnostiqueToMedecin" DROP CONSTRAINT "_DiagnostiqueToMedecin_B_fkey";

-- AlterTable
ALTER TABLE "Diagnostique" ADD COLUMN     "medecinId" TEXT;

-- DropTable
DROP TABLE "_DiagnostiqueToMedecin";

-- AddForeignKey
ALTER TABLE "Diagnostique" ADD CONSTRAINT "Diagnostique_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
