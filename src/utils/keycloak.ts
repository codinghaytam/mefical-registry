import KcAdminClient from '@keycloak/keycloak-admin-client';
import * as dotenv from "dotenv";
import { Response } from 'express';
dotenv.config();

let keycloakConnection: KcAdminClient | null = null;
const TOKEN_REFRESH_INTERVAL = 58 * 1000; // 58 seconds

const kcAdminClient = new KcAdminClient();
kcAdminClient.setConfig({
    realmName: 'myRealm',
    baseUrl: 'http://localhost:9090',
});

export async function connectToKeycloak() {
    if (keycloakConnection) {
        return keycloakConnection;
    }

    try {
        // Using client credentials instead of user password
        await kcAdminClient.auth({
            grantType: 'client_credentials',
            clientId: process.env.KEYCLOAK_CLIENT || 'medical-registry',
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'yMPWLw3KpQse36zns4HwHdS571Vz3z6W'
        });

        const refreshInterval = setInterval(async () => {
            try {
                // Using client credentials for refresh as well
                await kcAdminClient.auth({
                    grantType: 'client_credentials',
                    clientId: process.env.KEYCLOAK_CLIENT || 'medical-registry',
                    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'yMPWLw3KpQse36zns4HwHdS571Vz3z6W'
                });
            } catch (error) {
                console.error('Failed to refresh Keycloak token:', error);
                keycloakConnection = null;
                clearInterval(refreshInterval);
            }
        }, TOKEN_REFRESH_INTERVAL);

        keycloakConnection = kcAdminClient;
        return keycloakConnection;
    } catch (error) {
        console.error('Failed to connect to Keycloak:', error);
        keycloakConnection = null;
        throw error;
    }
}

// Helper function to safely connect to Keycloak and handle errors
export async function safeKeycloakConnect(res?: Response): Promise<KcAdminClient | null> {
    try {
        return await connectToKeycloak();
    } catch (error) {
        console.error('Keycloak connection error:', error);
        if (res) {
            res.status(503).send({ 
                error: "Keycloak service unavailable", 
                message: "Unable to connect to authentication service. Please try again later."
            });
        }
        return null;
    }
}

/**
 * Get a user from Keycloak by email
 * @param email The email address to search for
 * @param res Optional Express response object for error handling
 * @returns The Keycloak user record or null if not found
 */
export async function getUserByEmail(email: string, res?: Response) {
    try {
        const kc = await safeKeycloakConnect(res);
        if (!kc) return null;
        
        // Find users with the specified email
        const users = await kc.users.find({ email: email });
        
        // Return the first user found or null if no users are found
        return users && users.length > 0 ? users[0] : null;
    } catch (error) {
        console.error('Error finding Keycloak user by email:', error);
        return null;
    }
}

/**
 * Get multiple users from Keycloak by email pattern
 * @param emailPattern The email pattern to search for (can use wildcards like *)
 * @param res Optional Express response object for error handling
 * @returns Array of Keycloak user records or empty array if none found
 */
export async function getUsersByEmailPattern(emailPattern: string, res?: Response) {
    try {
        const kc = await safeKeycloakConnect(res);
        if (!kc) return [];
        
        // Find users with the email pattern (Keycloak handles wildcards in the search)
        const users = await kc.users.find({ email: emailPattern });
        
        return users || [];
    } catch (error) {
        console.error('Error finding Keycloak users by email pattern:', error);
        return [];
    }
}

/**
 * Get user from Keycloak by exact match on username or email
 * @param usernameOrEmail The username or email to search for
 * @param res Optional Express response object for error handling
 * @returns The Keycloak user record or null if not found
 */
export async function getUserByUsernameOrEmail(usernameOrEmail: string, res?: Response) {
    try {
        const kc = await safeKeycloakConnect(res);
        if (!kc) return null;
        
        // Try to find by exact username match
        let users = await kc.users.find({ username: usernameOrEmail, exact: true });
        
        // If not found by username, try by email
        if (!users || users.length === 0) {
            users = await kc.users.find({ email: usernameOrEmail });
        }
        
        return users && users.length > 0 ? users[0] : null;
    } catch (error) {
        console.error('Error finding Keycloak user by username or email:', error);
        return null;
    }
}
