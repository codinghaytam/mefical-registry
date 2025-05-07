import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import { deleteImageIfExists } from "../utils/upload.js";
const routes = express.Router();
const prisma = new PrismaClient();
// Configure storage for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
});
// File filter to only allow jpg, jpeg and png
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/jpg") {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
};
// Configure multer upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
});
// Upload middleware
const uploadSingleImage = upload.single('sondagePhoto');
// Get all reevaluations
routes.get("/", async function (_req, res, _next) {
    try {
        const reevaluations = await prisma.reevaluation.findMany({
            include: {
                seance: {
                    include: {
                        patient: true,
                        medecin: {
                            include: {
                                user: true
                            }
                        },
                        Reevaluation: true
                    }
                }
            }
        });
        if (!Array.isArray(reevaluations)) {
            throw new Error("Failed to fetch reevaluations");
        }
        // Transform the response to include full image URLs if needed
        const reevaluationsWithImageUrls = reevaluations.map(reevaluation => ({
            ...reevaluation,
            sondagePhoto: reevaluation.sondagePhoto
                ? `/uploads/${reevaluation.sondagePhoto}`
                : null
        }));
        res.status(200).send(reevaluationsWithImageUrls);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch reevaluations" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// Get a single reevaluation by ID
routes.get("/:id", async function (req, res, _next) {
    try {
        const reevaluation = await prisma.reevaluation.findUnique({
            where: { id: req.params.id },
            include: {
                seance: {
                    include: {
                        patient: true,
                        medecin: {
                            include: {
                                user: true
                            }
                        },
                        Reevaluation: true
                    }
                }
            }
        });
        if (!reevaluation) {
            res.status(404).send({ error: "Reevaluation not found" });
            return;
        }
        // Transform the response to include full image URL if needed
        const responseData = {
            ...reevaluation,
            sondagePhoto: reevaluation.sondagePhoto
                ? `/uploads/${reevaluation.sondagePhoto}`
                : null
        };
        res.status(200).send(responseData);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch reevaluation" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// Create a new reevaluation
routes.post("/", uploadSingleImage, async function (req, res, _next) {
    try {
        // Validate required fields
        console.log('Request body:', req.body);
        console.log('File:', req.file);
        // Extract reevaluation data from request body
        const { indiceDePlaque, indiceGingivale, patientId, medecinId, date, type = 'REEVALUATION' // Default to REEVALUATION type for the seance
         } = req.body;
        // Get image path from uploaded file - use filename instead of fieldname
        const imagePath = req.file?.filename;
        console.log('Image path:', imagePath);
        // Use a transaction to create both Seance and Reevaluation
        const result = await prisma.$transaction(async (tx) => {
            // First, create the Seance
            const newSeance = await tx.seance.create({
                data: {
                    type: type,
                    date: new Date(date),
                    patient: {
                        connect: { id: patientId }
                    },
                    medecin: {
                        connect: { id: medecinId }
                    }
                }
            });
            // Then create the Reevaluation linked to the Seance
            const newReevaluation = await tx.reevaluation.create({
                data: {
                    indiceDePlaque: parseFloat(indiceDePlaque),
                    indiceGingivale: parseFloat(indiceGingivale),
                    sondagePhoto: imagePath,
                    seance: {
                        connect: { id: newSeance.id }
                    }
                },
                include: {
                    seance: {
                        include: {
                            patient: true,
                            medecin: {
                                include: {
                                    user: true
                                }
                            }
                        }
                    }
                }
            });
            return newReevaluation;
        });
        // Add full image URL to response
        const responseData = {
            ...result,
            sondagePhoto: result.sondagePhoto
                ? `/uploads/${result.sondagePhoto}`
                : null
        };
        res.status(201).send(responseData);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to create reevaluation and seance" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// Update an existing reevaluation
routes.put("/:id", uploadSingleImage, async function (req, res, _next) {
    try {
        // Check if reevaluation exists
        const existingReevaluation = await prisma.reevaluation.findUnique({
            where: { id: req.params.id }
        });
        if (!existingReevaluation) {
            res.status(404).send({ error: "Reevaluation not found" });
            return;
        }
        // Extract data from request body
        const { indiceDePlaque, indiceGingivale, seanceId } = req.body;
        // Handle file upload - use the file directly from the request
        let imagePath = existingReevaluation.sondagePhoto;
        // If a new file is uploaded, delete the old one and use the new one
        if (req.file) {
            // Delete the old file if it exists
            if (existingReevaluation.sondagePhoto) {
                await deleteImageIfExists(existingReevaluation.sondagePhoto);
            }
            // Use the new file
            imagePath = req.file.filename;
        }
        // Update reevaluation
        const updatedReevaluation = await prisma.reevaluation.update({
            where: { id: req.params.id },
            data: {
                indiceDePlaque: indiceDePlaque !== undefined ? parseFloat(indiceDePlaque) : undefined,
                indiceGingivale: indiceGingivale !== undefined ? parseFloat(indiceGingivale) : undefined,
                sondagePhoto: imagePath,
                // Update seance if provided
                ...(seanceId ? {
                    seance: {
                        connect: { id: seanceId }
                    }
                } : {})
            },
            include: {
                seance: {
                    include: {
                        patient: true,
                        medecin: true
                    }
                }
            }
        });
        // Add full image URL to response
        const responseData = {
            ...updatedReevaluation,
            sondagePhoto: updatedReevaluation.sondagePhoto
                ? `/uploads/${updatedReevaluation.sondagePhoto}`
                : null
        };
        res.status(200).send(responseData);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to update reevaluation" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// Delete a reevaluation
routes.delete("/:id", async function (req, res, _next) {
    try {
        // Check if reevaluation exists
        const existingReevaluation = await prisma.reevaluation.findUnique({
            where: { id: req.params.id }
        });
        if (!existingReevaluation) {
            res.status(404).send({ error: "Reevaluation not found" });
            return;
        }
        // Delete associated image if it exists
        if (existingReevaluation?.sondagePhoto) {
            await deleteImageIfExists(existingReevaluation.sondagePhoto);
        }
        // Delete the reevaluation record
        await prisma.reevaluation.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to delete reevaluation" });
    }
    finally {
        await prisma.$disconnect();
    }
});
export default routes;
