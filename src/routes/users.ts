import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role } from "@prisma/client";
import KcAdminClient from '@keycloak/keycloak-admin-client';
import * as dotenv from "dotenv";
import { connectToKeycloak, safeKeycloakConnect } from '../utils/keycloak.js';

dotenv.config()


let kcAdminClient: KcAdminClient;
const routes = express.Router();
const prisma = new PrismaClient();

// Helper function to get Keycloak user info
async function getKeycloakUserInfo(userId: string) {
  try {
    const kc = await safeKeycloakConnect();
    if (!kc) return null;
    
    const user = await kc.users.findOne({ id: userId });
    return user;
  } catch (error) {
    console.error('Error fetching Keycloak user:', error);
    return null;
  }
}

interface UserRequestBody {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

// Get all users
routes.get("/", async function(_req: Request, res: Response, _next: NextFunction) {
    try {
        const users = await prisma.user.findMany();
        if (!Array.isArray(users)) {
            throw new Error("Failed to fetch users");
        }
        res.status(200).json(users);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch users" });
    } finally {
        await prisma.$disconnect();
    }
});

// Get users by role
routes.get("/role/:role", async function(req: Request, res: Response, _next: NextFunction) {
    try {
        const { role } = req.params;
        
        if (!(role in Role)) {
            res.status(400).json({ error: "Invalid role" });
        }
        
        const users = await prisma.user.findMany({
            where: { role: role as Role }
        });
        
        res.status(200).json(users);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch users by role" });
    } finally {
        await prisma.$disconnect();
    }
});

// GET all medecins
routes.get('/medecins', async function(_req: Request, res: Response) {
  try {
    const medecins = await prisma.medecin.findMany();
    if (!Array.isArray(medecins)) {
      throw new Error("Failed to fetch medecins");
    }

    const medecinsWithUserInfo = await Promise.all(medecins.map(async (medecin) => {
      const userInfo = await getKeycloakUserInfo(medecin.userId);
      return { ...medecin, userInfo };
    }));
    
    res.status(200).json(medecinsWithUserInfo);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch medecins" });
  } finally {
    await prisma.$disconnect();
  }
});

// Get user by ID
routes.get("/:id", async function(req: Request, res: Response, _next: NextFunction) {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).send({ error: "User ID is required" });
        }

        const user = await prisma.user.findUnique({
            where: { id }
        });
        
        if (!user) {
            res.status(404).send({ error: "User not found" });
        }
        
        res.status(200).json(user);
    } catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch user" });
    } finally {
        await prisma.$disconnect();
    }
});

// Get user by email
routes.get("/email/:email", async function(req: Request, res: Response, _next: NextFunction) {
    try {
        const { email } = req.params;
        if (!email) {
            res.status(400).json({ error: "Email is required" });
        }
        
        const user = await prisma.user.findUnique({
            where: { email }
        });
        
        if (!user) {
             res.status(404).json({ error: "User not found" });
        }
        
         res.status(200).json(user);
    } catch (e) {
        console.error(e);
         res.status(500).json({ error: "Failed to fetch user by email" });
    } finally {
        await prisma.$disconnect();
    }
});

// Create new user
routes.post("/", async function(req: Request, res: Response, _next: NextFunction) {
    try {
        const data = req.body;
        
        if (!data.password) {
          res.status(400).json({ error: "Password is required" });
        }
        
        if (!data.role || !(data.role in Role)) {
          res.status(400).json({ error: "Invalid role" });
        }
        
        // Create user in Keycloak
        const kc = await safeKeycloakConnect(res);
        if (!kc) return;
        
        const kcUser = await kc.users.create({
            username: data.username,
            email: data.email,
            firstName: data.name ? data.name.split(' ')[0] : '',
            lastName: data.name ? data.name.split(' ').slice(1).join(' ') : '',
            enabled: true,
            credentials: [{ type: 'password', value: data.password, temporary: false }],
        });
        
        // Remove password from data before storing in database
        const { password, ...userData } = data;
        
        // Create user in local database
        const user = await prisma.user.create({
            data: userData
        });
        
        res.status(201).json(user);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create user" });
    } finally {
        await prisma.$disconnect();
    }
});

// Update user
routes.put("/:id", async function(req: Request, res: Response, _next: NextFunction) {
    try {
        const { id } = req.params;
        if (!id) {
          res.status(400).json({ error: "User ID is required" });
        }
        
        const data = req.body;
        
        // Check if role is valid
        if (data.role && !(data.role in Role)) {
          res.status(400).json({ error: "Invalid role" });
        }
        
        // Get current user
        const currentUser = await prisma.user.findUnique({
            where: { id }
        });
        
        if (!currentUser) {
          res.status(404).json({ error: "User not found" });
        }
        
        // Update user in Keycloak if email or username changes
        if (currentUser && (data.email !== currentUser.email || data.username !== currentUser.username)) {
            const kc = await safeKeycloakConnect(res);
            if (!kc) return;
            
            const kcUsers = await kc.users.find({ email: currentUser.email });
            
            if (kcUsers && kcUsers.length > 0 && kcUsers[0].id) {
                await kc.users.update(
                    { id: kcUsers[0].id },
                    { 
                        email: data.email || currentUser.email, 
                        username: data.username || currentUser.username,
                        firstName: data.name ? data.name.split(' ')[0] : undefined,
                        lastName: data.name ? data.name.split(' ').slice(1).join(' ') : undefined
                    }
                );
                
                // Update password if provided
                if (data.password) {
                    await kc.users.resetPassword({
                        id: kcUsers[0].id,
                        credential: {
                            temporary: false,
                            type: 'password',
                            value: data.password
                        }
                    });
                }
            }
        }
        
        // Remove password from data before updating in database
        const { password, ...userData } = data;
        
        // Update user in local database
        const user = await prisma.user.update({
            where: { id },
            data: userData
        });
        
        res.status(200).json(user);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update user" });
    } finally {
        await prisma.$disconnect();
    }
});

// Delete user
routes.delete("/:id", async function(req: Request, res: Response, _next: NextFunction) {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "User ID is required" });
        }
        
        // Get user before deletion
        const user = await prisma.user.findUnique({
            where: { id }
        });
        
        if (!user) {
            res.status(404).json({ error: "User not found" });
        }
        
        // Delete associated records based on role
        if (user && user.role === 'MEDECIN') {
            const medecin = await prisma.medecin.findFirst({
                where: { userId: id }
            });
            
            if (medecin) {
                await prisma.medecin.delete({
                    where: { id: medecin.id }
                });
            }
        } else if (user && user.role === 'ETUDIANT') {
            const etudiant = await prisma.etudiant.findFirst({
                where: { userId: id }
            });
            
            if (etudiant) {
                await prisma.etudiant.delete({
                    where: { id: etudiant.id }
                });
            }
        } 
        // ADMIN is just a user with role ADMIN, no separate model exists for it
        // No additional deletion needed for ADMIN users
        
        // Delete user from local database
        await prisma.user.delete({
            where: { id }
        });
        
        // Delete user from Keycloak
        kcAdminClient = await connectToKeycloak();
        if(user){

          const kcUsers = await kcAdminClient.users.find({ email: user.email });
          if (kcUsers && kcUsers.length > 0 && kcUsers[0].id) {
              await kcAdminClient.users.del({ id: kcUsers[0].id });
          }
        }
        
        
        res.status(204).send();
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete user" });
    } finally {
        await prisma.$disconnect();
    }
});

export default routes;
