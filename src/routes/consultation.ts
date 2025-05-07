import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient, Consultation, MotifConsultation, HygieneBuccoDentaire, TypeMastication, Diagnostique } from '@prisma/client';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import * as dotenv from "dotenv";
import { connectToKeycloak } from '../utils/keycloak.js';
import { userInfo } from 'os';

dotenv.config();

let kcAdminClient: KcAdminClient;


const router = express.Router();
const prisma = new PrismaClient();

interface ConsultationRequestBody {
  date: Date;
  idConsultation: string;
  medecinId: string;
  patient: {
    nom: string;
    prenom: string;
    adresse: string;
    tel: string;
    numeroDeDossier: string;
    motifConsultation: MotifConsultation;
    anameseGenerale?: string;
    anamneseFamiliale?: string;
    anamneseLocale?: string;
    hygieneBuccoDentaire: HygieneBuccoDentaire;
    typeMastication: TypeMastication;
    antecedentsDentaires?: string;
  };
}

interface ConsultationUpdateBody {
  date?: Date;
  idConsultation?: string;
  patient?: {
    nom?: string;
    prenom?: string;
    adresse?: string;
    tel?: string;
    numeroDeDossier?: string;
    motifConsultation?: MotifConsultation;
    anameseGenerale?: string;
    anamneseFamiliale?: string;
    anamneseLocale?: string;
    hygieneBuccoDentaire?: HygieneBuccoDentaire;
    typeMastication?: TypeMastication;
    antecedentsDentaires?: string;
  };
}

// Add interface for Diagnosis
interface DiagnosisRequestBody {
  type: string;
  text: string;
  medecinId: string;
}

// GET all consultations
router.get('/', async function(_req: Request, res: Response, _next: NextFunction) {
  try {
    const consultations: Consultation[] = await prisma.consultation.findMany({
      include: {
        patient: true,
        medecin: {
          include: {
            user: true
          }
        },
        diagnostiques: {
          include: {
            Medecin: {
              include:{
                user:true
              }
            }
          }
        }
      }
    });
    
    if (!Array.isArray(consultations)) {
      throw new Error("Failed to fetch consultations");
    }

    // Return the consultations array directly
    res.status(200).send(consultations);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch consultations" });
  } finally {
    await prisma.$disconnect();
  }
});

// GET a specific consultation
router.get('/:id', async function(req: Request, res: Response, _next: NextFunction) {
  try {
    const consultation: Consultation | null = await prisma.consultation.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        medecin: {
          include: {
            user: true
          }
        },
        diagnostiques: {
          include: {
            Medecin: {
              include:{
                user:true
              }
            }
          }
        }
      }
    });
    if (consultation) {
      res.status(200).send(consultation);
    } else {
      res.status(404).send({ error: "Consultation not found" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch consultation" });
  } finally {
    await prisma.$disconnect();
  }
});

// POST a new consultation
router.post('/', async function(req: Request<{}, {}, ConsultationRequestBody>, res: Response, _next: NextFunction) {
  try {
    // First check if the medecin exists
    const medecin = await prisma.medecin.findUnique({
      where: { id: req.body.medecinId }
    });
    
    if (!medecin) {
      res.status(404).send({ 
        error: "No Medecin record found with ID: " + req.body.medecinId,
        hint: "Please verify the medecinId is correct and that the doctor exists in the database."
      });
      return; // Add return statement to prevent further execution
    }
    
    const newConsultation: Consultation = await prisma.consultation.create({
      data: {
        date: new Date(req.body.date),
        idConsultation: req.body.idConsultation,
        patient: {
          create: {
            nom: req.body.patient.nom,
            prenom: req.body.patient.prenom,
            adresse: req.body.patient.adresse,
            tel: req.body.patient.tel,
            numeroDeDossier: req.body.patient.numeroDeDossier,
            motifConsultation: req.body.patient.motifConsultation,
            anameseGenerale: req.body.patient.anameseGenerale,
            anamneseFamiliale: req.body.patient.anamneseFamiliale,
            anamneseLocale: req.body.patient.anamneseLocale,
            hygieneBuccoDentaire: req.body.patient.hygieneBuccoDentaire,
            typeMastication: req.body.patient.typeMastication,
            antecedentsDentaires: req.body.patient.antecedentsDentaires
          }
        },
        medecin: {
          connect: { id: req.body.medecinId }
        }
      },
      include: {
        patient: true,
        medecin: true
      }
    });
    res.status(201).send(newConsultation);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to create consultation" });
  } finally {
    await prisma.$disconnect();
  }
});

// Add new route for adding diagnosis to consultation
router.post('/:id/diagnosis', async function(req: Request<{id: string}, {}, DiagnosisRequestBody>, res: Response) {
  try {
    // First check if both the medecin and consultation exist
    const medecin = await prisma.medecin.findUnique({
      where: {id: req.body.medecinId}
    });
    
    if (!medecin) {
      res.status(404).send({ 
        error: "No Medecin record found with ID: " + req.body.medecinId,
        hint: "Please verify the medecinId is correct and that the doctor exists in the database."
      });
      return; // Add return statement to prevent further execution
    }
    
    const consultation = await prisma.consultation.findUnique({
      where: {id: req.params.id},
      include:{
        diagnostiques:{
          include:{
            Medecin: true
          }
        }
      }
    });
    
    if (!consultation) {
      res.status(404).send({
        error: "No Consultation record found with ID: " + req.params.id
      });
      return; // Add return statement to prevent further execution
    }
    
    if (consultation && (consultation.diagnostiques?.length ?? 0) >= 2) {
      res.status(401).send({error: "No more than 2 diagnoses are allowed for one consultation"});
      return; // Add return statement to prevent further execution
    }

    if(consultation){
      for (const diag of consultation.diagnostiques) {
        if (medecin && diag.Medecin?.profession === medecin.profession) {
          res.status(401).send({
            error: "Only one diagnosis of type " + medecin.profession + " is allowed"
          });
          return; // Add return statement to prevent further execution
        }
      }
    }

    const newDiagnosis = await prisma.diagnostique.create({
      data: {
        type: req.body.type,
        text: req.body.text,
        consultation: {
          connect: { id: req.params.id }
        },
        Medecin: {
          connect: { id: req.body.medecinId }
        }
      },
      include: {
        Medecin: true,
      }
    });
    
    res.status(201).send(newDiagnosis);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to create diagnosis" });
  } finally {
    await prisma.$disconnect();
  }
});

// PUT to update a specific consultation
router.put('/:id', async function(req: Request<{id: string}, {}, ConsultationUpdateBody>, res: Response, _next: NextFunction) {
  try {
    const updatedConsultation = await prisma.consultation.update({
      where: { id: req.params.id },
      data: {
        date: req.body.date ? new Date(req.body.date) : undefined,
        idConsultation: req.body.idConsultation,
        patient: req.body.patient ? {
          update: req.body.patient
        } : undefined
      },
      include: {
        patient: true,
        medecin: true
      }
    });
    res.status(200).send(updatedConsultation);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to update consultation" });
  } finally {
    await prisma.$disconnect();
  }
});

// Add route for updating diagnosis
router.put('/diagnosis/:diagnosisId', async function(req: Request<{diagnosisId: string}, {}, Partial<DiagnosisRequestBody>>, res: Response) {
  try {
    const updatedDiagnosis = await prisma.diagnostique.update({
      where: { id: req.params.diagnosisId },
      data: {
        type: req.body.type,
        text: req.body.text,
        Medecin: req.body.medecinId ? {
          connect: { id: req.body.medecinId }
        } : undefined
      },
      include: {
        Medecin: true
      }
    });
    res.status(200).send(updatedDiagnosis);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to update diagnosis" });
  } finally {
    await prisma.$disconnect();
  }
});

// DELETE a specific consultation
router.delete('/:id', async function(req: Request, res: Response) {
  try {
    // Use transaction to ensure atomic operation
    await prisma.$transaction(async (tx) => {
      const consultation = await tx.consultation.findUnique({
        where: { id: req.params.id },
        include: { patient: true, diagnostiques: true }
      });

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Delete all diagnoses first
      await tx.diagnostique.deleteMany({
        where: { consultationId: req.params.id }
      });

      // Delete consultation
      await tx.consultation.delete({
        where: { id: req.params.id }
      });

      // Then delete patient
      await tx.patient.delete({
        where: { id: consultation.patient.id }
      });
    });

    res.status(204).send();
  } catch (e) {
    console.error(e);
    if (e instanceof Error && e.message === 'Consultation not found') {
      res.status(404).send({ error: e.message });
    } else {
      res.status(500).send({ error: "Failed to delete consultation and patient" });
    }
  } finally {
    await prisma.$disconnect();
  }
});

export default router;