import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient, Action } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();



// GET all actions
router.get('/', async function(_req: Request, res: Response, _next: NextFunction) {
  try {
    const actions: Action[] = await prisma.action.findMany();
    res.status(200).send(actions);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch actions" });
  } finally {
    await prisma.$disconnect();
  }
});

// GET a specific action
router.get('/:id', async function(req: Request, res: Response, _next: NextFunction) {
  try {
    const action: Action | null = await prisma.action.findUnique({
      where: { id: req.params.id }
    });
    if (action) {
      res.status(200).send(action);
    } else {
      res.status(404).send({ error: "Action not found" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch action" });
  } finally {
    await prisma.$disconnect();
  }
});

// POST a new action
router.post('/', async function(req: Request, res: Response, _next: NextFunction) {
  try {
    const newAction: Action = await prisma.action.create({
      data: req.body
    });
    res.status(201).send(newAction);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to create action" });
  } finally {
    await prisma.$disconnect();
  }
});

// PUT to update a specific action
router.put('/:id', async function(req: Request<{id: string}>, res: Response, _next: NextFunction) {
  try {
    const updatedAction: Action = await prisma.action.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.status(200).send(updatedAction);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to update action" });
  } finally {
    await prisma.$disconnect();
  }
});

// DELETE a specific action
router.delete('/:id', async function(req: Request, res: Response, _next: NextFunction) {
  try {
    await prisma.action.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to delete action" });
  } finally {
    await prisma.$disconnect();
  }
});

export default router;