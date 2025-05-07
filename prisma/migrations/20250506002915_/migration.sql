/*
  Warnings:

  - You are about to drop the column `description` on the `Action` table. All the data in the column will be lost.
  - Added the required column `isValid` to the `Action` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Action` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('TRANSFER_ORTHO', 'TRANSFER_PARO');

-- AlterTable
ALTER TABLE "Action" DROP COLUMN "description",
ADD COLUMN     "isValid" BOOLEAN NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "ActionType" NOT NULL;
