import { createEntity } from '../lib/auth0';

const CLIENT_NAME = 'Default App';
const DB_CONNECTION_NAME = 'Username-Password-Authentication';

export const name = 'New Tenant';
export const description = `Creates a '${CLIENT_NAME}' client and a '${DB_CONNECTION_NAME}' connection`;

export const run = (accessTokens) =>
  // Create a regular web application
  createEntity('Client', 'client_id', '/api/v2/clients', accessTokens.v2, {
    name: CLIENT_NAME
  })
    // Create DB connection
    .then(client =>
      createEntity('Connection', 'id', '/api/v2/connections', accessTokens.v2, {
        name: DB_CONNECTION_NAME,
        strategy: 'auth0',
        enabled_clients: [ client.client_id ]
      })
    );
