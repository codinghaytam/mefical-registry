import express from 'express';
import { PrismaClient } from '@prisma/client';
const router = express.Router();
const prisma = new PrismaClient();
// GET all diagnostiques
router.get('/', async function (_req, res) {
    try {
        const diagnostiques = await prisma.diagnostique.findMany({
            include: {
                Medecin: {
                    include: {
                        user: true
                    }
                }
            }
        });
        res.status(200).send(diagnostiques);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch diagnostiques" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// GET a specific diagnostique
router.get('/:id', async function (req, res) {
    try {
        const diagnostique = await prisma.diagnostique.findUnique({
            where: { id: req.params.id },
            include: {
                Medecin: {
                    include: {
                        user: true
                    }
                }
            }
        });
        if (diagnostique) {
            res.status(200).send(diagnostique);
        }
        else {
            res.status(404).send({ error: "Diagnostique not found" });
        }
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch diagnostique" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// POST a new diagnostique
router.post('/', async function (req, res) {
    try {
        const newDiagnostique = await prisma.diagnostique.create({
            data: req.body
        });
        res.status(201).send(newDiagnostique);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to create diagnostique" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// PUT to update a specific diagnostique
router.put('/:id', async function (req, res) {
    try {
        const updatedDiagnostique = await prisma.diagnostique.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.status(200).send(updatedDiagnostique);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to update diagnostique" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// DELETE a specific diagnostique
router.delete('/:id', async function (req, res) {
    try {
        await prisma.diagnostique.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to delete diagnostique" });
    }
    finally {
        await prisma.$disconnect();
    }
});
export default router;
