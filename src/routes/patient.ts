import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient, Patient, MotifConsultation, HygieneBuccoDentaire, TypeMastication } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

interface PatientRequestBody {
  nom: string;
  numeroDeDossier: string;
  prenom: string;
  adresse: string;
  tel: string;
  motifConsultation: MotifConsultation;
  anameseGenerale?: string;
  anamneseFamiliale?: string;
  anamneseLocale?: string;
  hygieneBuccoDentaire: HygieneBuccoDentaire;
  typeMastication: TypeMastication;
  antecedentsDentaires?: string;
}

// GET all patients
router.get('/', async function(_req: Request, res: Response, _next: NextFunction) {
  try {
    const patients: Patient[] = await prisma.patient.findMany();
    if (!Array.isArray(patients)) {
      throw new Error("Failed to fetch patients");
    }
    res.status(200).send(patients);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch patients" });
  } finally {
    await prisma.$disconnect();
  }
});

// GET a specific patient
router.get('/:id', async function(req: Request, res: Response, _next: NextFunction) {
  try {
    const patient: Patient | null = await prisma.patient.findUnique({
      where: { id: req.params.id }
    });
    if (patient) {
      res.status(200).send(patient);
    } else {
      res.status(404).send({ error: "Patient not found" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch patient" });
  } finally {
    await prisma.$disconnect();
  }
});

// POST a new patient
router.post('/', async function(req: Request<{}, {}, PatientRequestBody>, res: Response, _next: NextFunction) {
  try {
    const newPatient: Patient = await prisma.patient.create({
      data: {
        ...req.body,
        motifConsultation: req.body.motifConsultation,
        hygieneBuccoDentaire: req.body.hygieneBuccoDentaire,
        typeMastication: req.body.typeMastication
      }
    });
    res.status(201).send(newPatient);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to create patient" });
  } finally {
    await prisma.$disconnect();
  }
});

// PUT to update a specific patient
router.put('/:id', async function(req: Request<{id: string}, {}, Partial<PatientRequestBody>>, res: Response, _next: NextFunction) {
  try {
    const updatedPatient: Patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        motifConsultation: req.body.motifConsultation as MotifConsultation,
        hygieneBuccoDentaire: req.body.hygieneBuccoDentaire as HygieneBuccoDentaire,
        typeMastication: req.body.typeMastication as TypeMastication
      }
    });
    res.status(200).send(updatedPatient);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to update patient" });
  } finally {
    await prisma.$disconnect();
  }
});

// DELETE a specific patient
router.delete('/:id', async function(req: Request, res: Response, _next: NextFunction) {
  try {
    await prisma.patient.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to delete patient" });
  } finally {
    await prisma.$disconnect();
  }
});

export default router;
