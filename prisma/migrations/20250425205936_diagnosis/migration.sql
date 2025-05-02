-- CreateTable
CREATE TABLE "_DiagnostiqueToMedecin" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DiagnostiqueToMedecin_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DiagnostiqueToMedecin_B_index" ON "_DiagnostiqueToMedecin"("B");

-- AddForeignKey
ALTER TABLE "_DiagnostiqueToMedecin" ADD CONSTRAINT "_DiagnostiqueToMedecin_A_fkey" FOREIGN KEY ("A") REFERENCES "Diagnostique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiagnostiqueToMedecin" ADD CONSTRAINT "_DiagnostiqueToMedecin_B_fkey" FOREIGN KEY ("B") REFERENCES "Medecin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
