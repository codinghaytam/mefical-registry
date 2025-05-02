-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ETUDIANT', 'MEDECIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Profession" AS ENUM ('PARODENTAIRE', 'ORTHODENTAIRE');

-- CreateEnum
CREATE TYPE "MotifConsultation" AS ENUM ('ESTHETIQUE', 'FONCTIONNELLE', 'ADRESSE_PAR_CONFRERE');

-- CreateEnum
CREATE TYPE "HygieneBuccoDentaire" AS ENUM ('BONNE', 'MOYENNE', 'MAUVAISE');

-- CreateEnum
CREATE TYPE "TypeMastication" AS ENUM ('UNILATERALE_ALTERNEE', 'UNILATERALE_STRICTE', 'BILATERALE');

-- CreateTable
CREATE TABLE "Medecin" (
    "id" TEXT NOT NULL,
    "profession" "Profession" NOT NULL,
    "isSpecialiste" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Medecin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etudiant" (
    "id" TEXT NOT NULL,
    "niveau" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Etudiant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "numeroDeDossier" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "tel" INTEGER NOT NULL,
    "motifConsultation" "MotifConsultation" NOT NULL,
    "anameseGenerale" TEXT,
    "anamneseFamiliale" TEXT,
    "anamneseLocale" TEXT,
    "hygieneBuccoDentaire" "HygieneBuccoDentaire" NOT NULL,
    "typeMastication" "TypeMastication" NOT NULL,
    "antecedentsDentaires" TEXT,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "idConsultation" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medecinId" TEXT NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnostique" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,

    CONSTRAINT "Diagnostique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seance" (
    "id" TEXT NOT NULL,
    "idSeance" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT NOT NULL,

    CONSTRAINT "Seance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "medecinId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Medecin_userId_key" ON "Medecin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Etudiant_userId_key" ON "Etudiant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_numeroDeDossier_key" ON "Patient"("numeroDeDossier");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_idConsultation_key" ON "Consultation"("idConsultation");

-- CreateIndex
CREATE UNIQUE INDEX "Seance_idSeance_key" ON "Seance"("idSeance");

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnostique" ADD CONSTRAINT "Diagnostique_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
