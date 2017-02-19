import { createEntity, updateEntity } from '../lib/auth0';
import * as request from '../lib/request';

const DB_CONNECTION_NAME = 'Task-Users';

export const name = 'API Authentication & Authorization';
export const description = 'Creates a SPA that uses a database connection with a single user as well as an API';
export const managementApiClientGrantScopes = [ 
  'update:tenant_settings', 
  'create:clients', 
  'create:connections', 'update:connections', 
  'create:users', 
  'create:resource_servers' 
];

export const run = (accessTokens) =>
  Promise.all([
    // Enable OAuth2 as a Service flag
    request.patch({
      url: `https://${process.env.RESETTENANT_AUTH0_DOMAIN}/api/v2/tenants/settings`,
      auth: { bearer: accessTokens.v2 },
      json: {
        flags: {
          change_pwd_flow_v1: false,
          enable_client_connections: true,
          enable_apis_section: true,
          enable_pipeline2: true
        }
      }
    }, 'reset tenant settings')
      .then(() => console.log('Tenant Settings: enable OAuth2 as a Service')),

    // Create a SPA
    createEntity('Client', 'client_id', '/api/v2/clients', accessTokens.v2, {
      name: 'Tasks SPA',
      callbacks: [ 'http://localhost:3000', 'http://jwt.io' ],
      app_type: 'spa'
    })
      // Create DB connection
      .then(client =>
        createEntity('Connection', 'id', '/api/v2/connections', accessTokens.v2, {
          name: DB_CONNECTION_NAME,
          strategy: 'auth0',
          enabled_clients: [ client.client_id, process.env.RESETTENANT_NIC_CLIENT_ID ]
        })
        // Add a single user
        .then(connection =>
          createEntity('User', 'user_id', '/api/v2/users', accessTokens.v2, {
            connection: DB_CONNECTION_NAME,
            email: 'foo@example.com',
            password: 'pw',
            user_metadata: {
              given_name: 'Foo',
              family_name: 'Bar',
              name: 'Foo Bar'
            }
          })
          // remove RESETTENANT_NIC_CLIENT_ID from the connection's enabled clients
          .then(() =>
            updateEntity('Connection', connection.id, '/api/v2/connections', accessTokens.v2, {
              enabled_clients: [ client.client_id ]
            })
          )
        )
      )
      // Create an API
      .then(() =>
        createEntity('API', 'id', '/api/v2/resource-servers', accessTokens.v2, {
          name: 'Task API',
          identifier: 'https://example.com/api/tasks',
          scopes: [
            { value: 'read:tasks', description: 'Read your tasks' },
            { value: 'create:tasks', description: 'Create new tasks' }
          ]
        })
      )
  ]);
