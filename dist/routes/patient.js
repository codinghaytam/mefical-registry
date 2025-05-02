import express from 'express';
import { PrismaClient } from '@prisma/client';
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
export default router;
