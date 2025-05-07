import express, { Request, Response, NextFunction } from 'express';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import * as dotenv from "dotenv";
import { connectToKeycloak, safeKeycloakConnect, getUserByEmail } from '../utils/keycloak.js';
import { PrismaClient, User, Role } from '@prisma/client';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();
let kcAdminClient: KcAdminClient;

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

interface AdminRequestBody {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  pwd?: string;
}

/* GET admins listing. */
router.get('/', async function(_req: Request, res: Response) {
  try {
    // Get admin users from database
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN' as Role
      }
    });
    
    // Get additional info from Keycloak for each admin
    const adminsWithDetails = await Promise.all(
      adminUsers.map(async (adminUser) => {
        const kcUser = await getUserByEmail(adminUser.email);
        if (kcUser) {
          return {
            ...adminUser,
            keycloakId: kcUser.id,
            firstName: kcUser.firstName,
            lastName: kcUser.lastName
          };
        }
        return adminUser;
      })
    );
    
    res.status(200).send(adminsWithDetails);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch admins" });
  } finally {
    await prisma.$disconnect();
  }
});

// Get admin by email route
router.get('/email/:email', async function(req: Request, res: Response, _next: NextFunction): Promise<any> {
  try {
    // Find admin user in database
    const dbUser = await prisma.user.findFirst({
      where: { 
        email: req.params.email,
        role: 'ADMIN' as Role
      }
    });
    
    if (!dbUser) {
      res.status(404).send({ error: "Admin not found in database" });
      return;
    }
    
    // Get Keycloak details using the new utility function
    const kcUser = await getUserByEmail(req.params.email, res);
    
    res.status(200).send({
      ...dbUser,
      keycloakDetails: kcUser || null
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch admin by email" });
  } finally {
    await prisma.$disconnect();
  }
});

router.get('/:id', async function(req: Request, res: Response, _next: NextFunction): Promise<any> {
  try {
    // First check if this is a Keycloak ID
    const keycloakUser = await getKeycloakUserInfo(req.params.id);
    
    if (keycloakUser) {
      // If it's a Keycloak ID, look for corresponding database user with ADMIN role
      const dbUser = await prisma.user.findFirst({
        where: { 
          email: keycloakUser.email,
          role: 'ADMIN' as Role
        }
      });
      
      if (!dbUser) {
        res.status(404).send({ error: "User is not an admin in the database" });
        return;
      }
      
      res.status(200).send({
        ...keycloakUser,
        dbUser
      });
    } else {
      // If not a Keycloak ID, try to find by database ID
      const dbUser = await prisma.user.findUnique({
        where: { id: req.params.id },
      });
      
      if (!dbUser || dbUser.role !== 'ADMIN') {
        res.status(404).send({ error: "Admin not found" });
        return;
      }
      
      // Get Keycloak details using the new utility function
      const kcUser = await getUserByEmail(dbUser.email, res);
      
      res.status(200).send({
        ...dbUser,
        keycloakDetails: kcUser || null
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch admin" });
  } finally {
    await prisma.$disconnect();
  }
});

router.post('/', async function(req: Request<{}, {}, AdminRequestBody>, res: Response) {
  try {
    // Connect to Keycloak
    const kc = await safeKeycloakConnect(res);
    if (!kc) {
      res.send(409);
      return;
    }
    
    // Check if user already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email: req.body.email }
    });
    
    if (existingUser) {
      res.status(400).send({ error: "User with this email already exists" });
      return;
    }
    
    // Check if user exists in Keycloak using the new utility function
    const existingKeycloakUser = await getUserByEmail(req.body.email, res);
    if (existingKeycloakUser) {
      res.status(400).send({ error: "User with this email already exists in Keycloak" });
      return;
    }
    
    // Create user in Keycloak
    const keycloakUser = await kc.users.create({
      username: req.body.username,
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      enabled: true,
      credentials: req.body.pwd ? [{ 
        type: 'password', 
        value: req.body.pwd, 
        temporary: false 
      }] : undefined,
    });
    
    // Create user in database with ADMIN role - this is now the only place role is stored
    const dbUser = await prisma.user.create({
      data: {
        email: req.body.email,
        username: req.body.username,
        name: `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim(),
        role: 'ADMIN' as Role
      }
    });

    res.status(201).send({
      ...dbUser,
      keycloakId: keycloakUser.id
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to create admin user: " + e });
  } finally {
    await prisma.$disconnect();
  }
});

router.put('/:id', async function(req: Request<{id: string}, {}, Partial<AdminRequestBody>>, res: Response): Promise<any> {
  try {
    // First check if the admin exists in our database
    const dbUser = await prisma.user.findFirst({
      where: { 
        id: req.params.id,
        role: 'ADMIN' as Role
      }
    });
    
    if (!dbUser) {
      res.status(404).send({ error: "Admin not found in database" });
      return;
    }

    // Connect to Keycloak
    const kc = await safeKeycloakConnect(res);
    if (!kc) return;
    
    // Find the Keycloak user using the new utility function
    const kcUser = await getUserByEmail(dbUser.email, res);
    if (!kcUser) {
      res.status(404).send({ error: "Admin not found in Keycloak" });
      return;
    }
    
    // Update Keycloak user
    await kc.users.update(
      { id: kcUser.id || "" },
      {
        username: req.body.username,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      }
    );

    // Update database user
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        email: req.body.email,
        username: req.body.username,
        name: req.body.firstName && req.body.lastName 
          ? `${req.body.firstName} ${req.body.lastName}` 
          : undefined
      }
    });

    // If password provided, update it
    if (req.body.pwd) {
      await kc.users.resetPassword({
        id: kcUser.id ?? "",
        credential: {
          temporary: false,
          type: 'password',
          value: req.body.pwd,
        },
      });
    }

    const updatedKeycloakUser = await kc.users.findOne({ id: kcUser.id ?? ""});
    
    res.status(200).send({
      ...updatedUser,
      keycloakDetails: updatedKeycloakUser
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to update admin" });
  } finally {
    await prisma.$disconnect();
  }
});

router.delete('/:id', async function(req: Request, res: Response): Promise<any> {
  try {
    // Find the admin in our database
    const dbUser = await prisma.user.findFirst({
      where: { 
        id: req.params.id,
        role: 'ADMIN' as Role
      }
    });
    
    if (!dbUser) {
      res.status(404).send({ error: "Admin not found in database" });
      return;
    }

    // Connect to Keycloak
    const kc = await safeKeycloakConnect(res);
    if (!kc) return;
    
    // Find the Keycloak user using the new utility function
    const kcUser = await getUserByEmail(dbUser.email, res);
    
    // Delete from database
    await prisma.user.delete({ where: { id: req.params.id } });
    
    // Delete from Keycloak if found
    if (kcUser) {
      await kc.users.del({ id: kcUser.id ?? "" });
    }

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to delete admin" });
  } finally {
    await prisma.$disconnect();
  }
});

export default router;