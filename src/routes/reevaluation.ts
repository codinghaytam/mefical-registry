import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient} from "@prisma/client";

const routes = express.Router();
const prisma = new PrismaClient();

routes.get("/",async ()=>{
    try{
        const reevaluations =
    }
})