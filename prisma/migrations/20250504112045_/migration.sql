/*
  Warnings:

  - You are about to drop the column `date` on the `Reevaluation` table. All the data in the column will be lost.
  - You are about to drop the column `medecinId` on the `Reevaluation` table. All the data in the column will be lost.
  - You are about to drop the column `patientId` on the `Reevaluation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[seanceId]` on the table `Reevaluation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seanceId` to the `Reevaluation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "SeanceType" ADD VALUE 'REEVALUATION';

-- DropForeignKey
ALTER TABLE "Reevaluation" DROP CONSTRAINT "Reevaluation_medecinId_fkey";

-- DropForeignKey
ALTER TABLE "Reevaluation" DROP CONSTRAINT "Reevaluation_patientId_fkey";

-- AlterTable
ALTER TABLE "Reevaluation" DROP COLUMN "date",
DROP COLUMN "medecinId",
DROP COLUMN "patientId",
ADD COLUMN     "seanceId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Reevaluation_seanceId_key" ON "Reevaluation"("seanceId");

-- AddForeignKey
ALTER TABLE "Reevaluation" ADD CONSTRAINT "Reevaluation_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
