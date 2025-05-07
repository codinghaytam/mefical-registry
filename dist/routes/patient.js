import express from 'express';
import { PrismaClient, Profession, ActionType } from '@prisma/client';
const router = express.Router();
const prisma = new PrismaClient();
// GET all patients
router.get('/', async function (_req, res, _next) {
    try {
        const patients = await prisma.patient.findMany();
        if (!Array.isArray(patients)) {
            throw new Error("Failed to fetch patients");
        }
        res.status(200).send(patients);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch patients" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// GET a specific patient
router.get('/:id', async function (req, res, _next) {
    try {
        const patient = await prisma.patient.findUnique({
            where: { id: req.params.id }
        });
        if (patient) {
            res.status(200).send(patient);
        }
        else {
            res.status(404).send({ error: "Patient not found" });
        }
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch patient" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// POST a new patient
router.post('/', async function (req, res, _next) {
    try {
        const newPatient = await prisma.patient.create({
            data: {
                ...req.body,
                motifConsultation: req.body.motifConsultation,
                hygieneBuccoDentaire: req.body.hygieneBuccoDentaire,
                typeMastication: req.body.typeMastication
            }
        });
        res.status(201).send(newPatient);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to create patient" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// PUT to update a specific patient
router.put('/:id', async function (req, res, _next) {
    try {
        const updatedPatient = await prisma.patient.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                motifConsultation: req.body.motifConsultation,
                hygieneBuccoDentaire: req.body.hygieneBuccoDentaire,
                typeMastication: req.body.typeMastication
            }
        });
        res.status(200).send(updatedPatient);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to update patient" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// DELETE a specific patient
router.delete('/:id', async function (req, res, _next) {
    try {
        await prisma.patient.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to delete patient" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// Fix router.put method for Paro-Ortho transfer
router.put('/Paro-Ortho/:id', (async (req, res, _next) => {
    try {
        // Get the medecin ID from the request body
        const { medecinId } = req.body;
        if (!medecinId) {
            return res.status(400).send({ error: "MedecinId is required in the request body" });
        }
        // Update patient state to ORTHODONTAIRE
        const patient = await prisma.patient.update({
            where: { id: req.params.id },
            data: { State: Profession.ORTHODONTAIRE }
        });
        // Create an action record for the transfer using Prisma ORM
        await prisma.action.create({
            data: {
                type: ActionType.TRANSFER_ORTHO,
                date: new Date(),
                isValid: false,
                medecin: {
                    connect: { id: medecinId }
                },
                patient: {
                    connect: { id: req.params.id }
                }
            }
        });
        res.status(200).send({ message: "Patient transferred to Orthodontic service", patient });
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to transfer patient to Orthodontic service" });
    }
    finally {
        await prisma.$disconnect();
    }
}));
router.put('/Ortho-Paro/:id', (async (req, res, _next) => {
    try {
        // Get the medecin ID from the request body
        const { medecinId } = req.body;
        if (!medecinId) {
            return res.status(400).send({ error: "MedecinId is required in the request body" });
        }
        // Update patient state to PARODONTAIRE
        const patient = await prisma.patient.update({
            where: { id: req.params.id },
            data: { State: Profession.PARODONTAIRE }
        });
        // Create an action record for the transfer using Prisma ORM
        await prisma.action.create({
            data: {
                type: ActionType.TRANSFER_PARO,
                date: new Date(),
                isValid: true,
                medecin: {
                    connect: { id: medecinId }
                },
                patient: {
                    connect: { id: req.params.id }
                }
            }
        });
        res.status(200).send({ message: "Patient transferred to Periodontal service", patient });
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to transfer patient to Periodontal service" });
    }
    finally {
        await prisma.$disconnect();
    }
}));
// PUT to validate a transfer to Orthodontic service
router.put('/validate-transfer/:actionId', (async (req, res, _next) => {
    try {
        // Find the action by ID using Prisma ORM
        const action = await prisma.action.findUnique({
            where: { id: req.params.actionId },
            include: { patient: true }
        });
        if (!action) {
            return res.status(404).send({ error: "Action not found" });
        }
        if (action.type !== ActionType.TRANSFER_ORTHO) {
            return res.status(400).send({ error: "Action is not a TRANSFER_ORTHO type" });
        }
        if (action.isValid) {
            return res.status(400).send({ error: "This transfer has already been validated" });
        }
        // Update the action to mark it as valid using Prisma ORM
        await prisma.action.update({
            where: { id: req.params.actionId },
            data: { isValid: true }
        });
        // Ensure the patient is properly transferred to ORTHODONTAIRE state
        const patient = await prisma.patient.update({
            where: { id: action.patientId },
            data: { State: Profession.ORTHODONTAIRE }
        });
        res.status(200).send({
            message: "Transfer to Orthodontic service validated successfully",
            patient
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to validate transfer action" });
    }
    finally {
        await prisma.$disconnect();
    }
}));
export default router;
