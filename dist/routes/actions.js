import express from 'express';
import { PrismaClient, ActionType } from '@prisma/client';
const router = express.Router();
const prisma = new PrismaClient();
// GET all actions
router.get('/', async function (_req, res, _next) {
    try {
        const actions = await prisma.action.findMany();
        res.status(200).send(actions);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch actions" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// GET a specific action
router.get('/:id', async function (req, res, _next) {
    try {
        const action = await prisma.action.findUnique({
            where: { id: req.params.id }
        });
        if (action) {
            res.status(200).send(action);
        }
        else {
            res.status(404).send({ error: "Action not found" });
        }
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch action" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// POST a new action
router.post('/', async function (req, res, _next) {
    try {
        const newAction = await prisma.action.create({
            data: req.body
        });
        res.status(201).send(newAction);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to create action" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// PUT to update a specific action
router.put('/:id', async function (req, res, _next) {
    try {
        const updatedAction = await prisma.action.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.status(200).send(updatedAction);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to update action" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// DELETE a specific action
router.delete('/:id', async function (req, res, _next) {
    try {
        await prisma.action.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to delete action" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// PUT to validate a TRANSFER_ORTHO action
router.put('/validate-transfer-ortho/:id', async function (req, res, _next) {
    try {
        // Get the action and validate it's a TRANSFER_ORTHO type
        const action = await prisma.action.findUnique({
            where: { id: req.params.id },
            include: { patient: true }
        });
        if (!action) {
            res.status(404).send({ error: "Action not found" });
            return;
        }
        if (action.type !== ActionType.TRANSFER_ORTHO) {
            res.status(400).send({ error: "Action is not a TRANSFER_ORTHO type" });
            return;
        }
        // Update the action to mark it as valid
        const updatedAction = await prisma.action.update({
            where: { id: req.params.id },
            data: { isValid: true }
        });
        // Ensure the patient is properly transferred to ORTHODONTAIRE state
        await prisma.patient.update({
            where: { id: action.patientId },
            data: { State: 'ORTHODONTAIRE' }
        });
        res.status(200).send({
            message: "Transfer to Orthodontic service validated successfully",
            action: updatedAction
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to validate transfer action" });
    }
    finally {
        await prisma.$disconnect();
    }
});
export default router;
