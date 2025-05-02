import KcAdminClient from '@keycloak/keycloak-admin-client';
import * as dotenv from "dotenv";
dotenv.config();
let keycloakConnection = null;
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
        await kcAdminClient.auth({
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD,
            grantType: 'password',
            clientId: process.env.KEYCLOAK_CLIENT || '',
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET
        });
        const refreshInterval = setInterval(async () => {
            try {
                await kcAdminClient.auth({
                    username: process.env.ADMIN_USERNAME,
                    password: process.env.ADMIN_PASSWORD,
                    grantType: 'password',
                    clientId: process.env.KEYCLOAK_CLIENT || '',
                    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET
                });
            }
            catch (error) {
                console.error('Failed to refresh Keycloak token:', error);
                keycloakConnection = null;
                clearInterval(refreshInterval);
            }
        }, TOKEN_REFRESH_INTERVAL);
        keycloakConnection = kcAdminClient;
        return keycloakConnection;
    }
    catch (error) {
        console.error('Failed to connect to Keycloak:', error);
        keycloakConnection = null;
        throw error;
    }
}
