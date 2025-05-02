/*
  Warnings:

  - Changed the type of `type` on the `Seance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SeanceType" AS ENUM ('DETARTRAGE', 'SURFACAGE', 'ACTIVATION', 'RECOLLAGE');

-- AlterTable
ALTER TABLE "Seance" DROP COLUMN "type",
ADD COLUMN     "type" "SeanceType" NOT NULL;

-- CreateTable
CREATE TABLE "Reevaluation" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Reevaluation_pkey" PRIMARY KEY ("id")
);
