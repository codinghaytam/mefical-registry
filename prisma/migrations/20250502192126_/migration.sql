/*
  Warnings:

  - Added the required column `date` to the `Reevaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `indiceDePlaque` to the `Reevaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `indiceGingivale` to the `Reevaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medecinId` to the `Reevaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `Reevaluation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reevaluation" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "indiceDePlaque" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "indiceGingivale" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "medecinId" TEXT NOT NULL,
ADD COLUMN     "patientId" TEXT NOT NULL,
ADD COLUMN     "sondagePhoto" TEXT;

-- AddForeignKey
ALTER TABLE "Reevaluation" ADD CONSTRAINT "Reevaluation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reevaluation" ADD CONSTRAINT "Reevaluation_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
