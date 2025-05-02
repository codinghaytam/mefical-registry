'use strict';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import * as dotenv from "dotenv";
import { connectToKeycloak } from '../utils/keycloak.js';
dotenv.config();
let kcAdminClient;
const router = express.Router();
const prisma = new PrismaClient();
// Helper function to get Keycloak user info
async function getKeycloakUserInfo(userId) {
    try {
        kcAdminClient = await connectToKeycloak();
        const user = await kcAdminClient.users.findOne({ id: userId });
        return user;
    }
    catch (error) {
        console.error('Error fetching Keycloak user:', error);
        return null;
    }
}
router.get('/', async function (_req, res, _next) {
    try {
        const etudiants = await prisma.etudiant.findMany();
        if (!Array.isArray(etudiants)) {
            throw new Error("Failed to fetch etudiants");
        }
        const etudiantsWithUserInfo = await Promise.all(etudiants.map(async (etudiant) => {
            const userInfo = await getKeycloakUserInfo(etudiant.userId);
            return { ...etudiant, userInfo };
        }));
        res.status(200).send(etudiantsWithUserInfo);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch etudiants" });
    }
    finally {
        await prisma.$disconnect();
    }
});
router.get('/:id', async function (req, res, _next) {
    try {
        const etudiant = await prisma.etudiant.findUnique({
            where: { id: req.params.id }
        });
        if (!etudiant) {
            return res.status(404).send({ error: "Etudiant not found" });
        }
        const userInfo = await getKeycloakUserInfo(etudiant.userId);
        res.status(200).send({ ...etudiant, userInfo });
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch etudiant" });
    }
    finally {
        await prisma.$disconnect();
        return;
    }
});
router.post('/', async function (req, res, _next) {
    try {
        await kcAdminClient.users.create({
            username: req.body.username,
            email: req.body.email
        });
        const userInfo = await kcAdminClient.users.find({ username: req.body.username });
        const newEtudiant = await prisma.etudiant.create({
            data: {
                userId: userInfo[0].id,
                niveau: parseInt(req.body.niveau), // Ensure 'niveau' is provided and parsed as a number
            }
        });
        res.status(201).send("user " + newEtudiant.id + "created");
    }
    catch (e) {
        res.status(500).send({ error: "Failed to create etudiant and Keycloak user: " + e });
    }
    finally {
        await prisma.$disconnect();
    }
});
router.put('/:id', async function (req, res, _next) {
    try {
        const updatedEtudiant = await prisma.etudiant.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                niveau: req.body.niveau ? parseInt(req.body.niveau) : undefined
            }
        });
        const userInfo = await getKeycloakUserInfo(updatedEtudiant.userId);
        res.status(200).send({ ...updatedEtudiant, userInfo });
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to update etudiant" });
    }
    finally {
        await prisma.$disconnect();
    }
});
router.delete('/:id', async function (req, res, _next) {
    try {
        await prisma.etudiant.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to delete etudiant" });
    }
    finally {
        await prisma.$disconnect();
    }
});
export default router;
