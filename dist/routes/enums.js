import express from 'express';
import { PrismaClient, MotifConsultation, TypeMastication, HygieneBuccoDentaire } from '@prisma/client';
const router = express.Router();
const prisma = new PrismaClient();
router.get('/motif-consultation', async (_req, res, _next) => {
    res.status(200).send(Object.values(MotifConsultation));
});
router.get('/type-mastication', async (_req, res, _next) => {
    res.status(200).send(Object.values(TypeMastication));
});
router.get('/hygiene-bucco-dentaire', async (_req, res, _next) => {
    res.status(200).send(Object.values(HygieneBuccoDentaire));
});
export default router;
