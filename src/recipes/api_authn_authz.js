import { createEntity, updateEntity } from '../lib/auth0';

const DB_CONNECTION_NAME = 'Task-Users';

export const name = 'API Authentication & Authorization';
export const description = 'Creates a SPA that uses a database connection with a single user as well as an API';

export const run = (accessTokens) =>
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
      enabled_clients: [ client.client_id, process.env.API_CLIENT_ID ]
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
      // remove API_CLIENT_ID from the connection's enabled clients
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
  );
