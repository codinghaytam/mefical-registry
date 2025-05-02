import express from 'express';
import * as dotenv from "dotenv";
import { connectToKeycloak } from '../utils/keycloak.js';
import { PrismaClient } from '@prisma/client';
dotenv.config({ path: "./../../.env" });
const router = express.Router();
const prisma = new PrismaClient();
let kcAdminClient;
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
/* GET users listing. */
router.get('/', async function (_req, res) {
    try {
        kcAdminClient = await connectToKeycloak();
        const users = await kcAdminClient.users.find();
        if (!Array.isArray(users)) {
            throw new Error("Failed to fetch users from Keycloak");
        }
        res.status(200).send(users);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch users" });
    }
});
// GET all medecins
router.get('/medecins', async function (_req, res) {
    try {
        const medecins = await prisma.medecin.findMany();
        if (!Array.isArray(medecins)) {
            throw new Error("Failed to fetch medecins");
        }
        const medecinsWithUserInfo = await Promise.all(medecins.map(async (medecin) => {
            const userInfo = await getKeycloakUserInfo(medecin.userId);
            return { ...medecin, userInfo };
        }));
        res.status(200).send(medecinsWithUserInfo);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch medecins" });
    }
});
router.get('/:id', async function (req, res) {
    try {
        const keycloakUser = await getKeycloakUserInfo(req.params.id);
        if (!keycloakUser) {
            return res.status(404).send({ error: "User not found" });
        }
        return res.status(200).send(keycloakUser);
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to fetch user" });
    }
});
router.post('/', async function (req, res) {
    try {
        kcAdminClient = await connectToKeycloak();
        // Create user in Keycloak
        const keycloakUser = await kcAdminClient.users.create({
            username: req.body.username,
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            enabled: true,
        });
        res.status(201).send(keycloakUser);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to create Keycloak user: " + e });
    }
});
router.put('/:id', async function (req, res) {
    try {
        kcAdminClient = await connectToKeycloak();
        const keycloakUser = await getKeycloakUserInfo(req.params.id);
        if (!keycloakUser) {
            return res.status(404).send({ error: "User not found" });
        }
        // Update Keycloak user
        await kcAdminClient.users.update({ id: req.params.id }, {
            username: req.body.username,
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
        });
        const updatedUser = await getKeycloakUserInfo(req.params.id);
        return res.status(200).send(updatedUser);
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to update user" });
    }
});
router.delete('/:id', async function (req, res) {
    try {
        kcAdminClient = await connectToKeycloak();
        const keycloakUser = await getKeycloakUserInfo(req.params.id);
        if (!keycloakUser) {
            return res.status(404).send({ error: "User not found" });
        }
        // Delete from Keycloak
        await kcAdminClient.users.del({ id: req.params.id });
        return res.status(204).send();
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to delete user" });
    }
});
export default router;
