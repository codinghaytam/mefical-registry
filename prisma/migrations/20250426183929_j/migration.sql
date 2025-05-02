/*
  Warnings:

  - The values [PARODENTAIRE,ORTHODENTAIRE] on the enum `Profession` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Profession_new" AS ENUM ('PARODONTAIRE', 'ORTHODONTAIRE');
ALTER TABLE "Medecin" ALTER COLUMN "profession" TYPE "Profession_new" USING ("profession"::text::"Profession_new");
ALTER TYPE "Profession" RENAME TO "Profession_old";
ALTER TYPE "Profession_new" RENAME TO "Profession";
DROP TYPE "Profession_old";
COMMIT;
