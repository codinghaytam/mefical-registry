import express, { Request, Response } from 'express';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import * as dotenv from "dotenv";
import { connectToKeycloak } from '../utils/keycloak.js';

dotenv.config();

const router = express.Router();
let kcAdminClient: KcAdminClient;

// Helper function to get Keycloak user info
async function getKeycloakUserInfo(userId: string) {
  try {
    kcAdminClient = await connectToKeycloak();
    const user = await kcAdminClient.users.findOne({ id: userId });
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
}

// Helper function to assign admin role to user
async function assignAdminRole(userId: string) {
  try {
    kcAdminClient = await connectToKeycloak();
    // Get admin role
    const roles = await kcAdminClient.roles.find();
    const adminRole = roles.find(role => role.name === 'admin');
    
    if (!adminRole) {
      throw new Error('Admin role not found in Keycloak');
    }

    // Assign admin role to user
    await kcAdminClient.users.addRealmRoleMappings({
      id: userId,
      roles: [
        {
          id: adminRole.id!,
          name: adminRole.name!,
        },
      ],
    });
  } catch (error) {
    console.error('Error assigning admin role:', error);
    throw error;
  }
}

/* GET admins listing. */
router.get('/', async function(_req: Request, res: Response) {
  try {
    kcAdminClient = await connectToKeycloak();
    const users = await kcAdminClient.users.find();
    // Filter users with admin role
    const admins = await Promise.all(
      users.map(async (user) => {
        const roles = await kcAdminClient.users.listRealmRoleMappings({ id: user.id! });
        if (roles.some(role => role.name === 'admin')) {
          return user;
        }
        return null;
      })
    );
    res.status(200).send(admins.filter(admin => admin !== null));
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch admins" });
  }
});

router.get('/:id', async function(req: Request, res: Response):Promise<any> {
  try {
    const keycloakUser = await getKeycloakUserInfo(req.params.id);
    if (!keycloakUser) {
      return res.status(404).send({ error: "Admin not found" });
    }
    
    kcAdminClient = await connectToKeycloak();
    // Check if user has admin role
    const roles = await kcAdminClient.users.listRealmRoleMappings({ id: req.params.id });
    if (!roles.some(role => role.name === 'admin')) {
      return res.status(404).send({ error: "User is not an admin" });
    }
    
    res.status(200).send(keycloakUser);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch admin" });
  }
});

router.post('/', async function(req: Request<{}, {}, AdminRequestBody>, res: Response) {
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

    // Assign admin role
    await assignAdminRole(keycloakUser.id!);

    res.status(201).send(keycloakUser);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to create admin user: " + e });
  }
});

router.put('/:id', async function(req: Request<{id: string}, {}, Partial<AdminRequestBody>>, res: Response):Promise<any> {
  try {
    const keycloakUser = await getKeycloakUserInfo(req.params.id);
    if (!keycloakUser) {
      return res.status(404).send({ error: "Admin not found" });
    }

    kcAdminClient = await connectToKeycloak();
    // Check if user has admin role
    const roles = await kcAdminClient.users.listRealmRoleMappings({ id: req.params.id });
    if (!roles.some(role => role.name === 'admin')) {
      return res.status(404).send({ error: "User is not an admin" });
    }

    // Update Keycloak user
    await kcAdminClient.users.update(
      { id: req.params.id },
      {
        username: req.body.username,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      }
    );

    const updatedUser = await getKeycloakUserInfo(req.params.id);
    return res.status(200).send(updatedUser);
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to update admin" });
  }
});

router.delete('/:id', async function(req: Request, res: Response):Promise<any> {
  try {
    const keycloakUser = await getKeycloakUserInfo(req.params.id);
    if (!keycloakUser) {
      return res.status(404).send({ error: "Admin not found" });
    }

    kcAdminClient = await connectToKeycloak();
    // Check if user has admin role
    const roles = await kcAdminClient.users.listRealmRoleMappings({ id: req.params.id });
    if (!roles.some(role => role.name === 'admin')) {
      return res.status(404).send({ error: "User is not an admin" });
    }

    // Delete from Keycloak
    await kcAdminClient.users.del({ id: req.params.id });
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to delete admin" });
  }
});

export default router;