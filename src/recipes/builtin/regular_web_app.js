import { createEntity, updateEntity } from '../lib/auth0';

const DB_CONNECTION_NAME = 'Sweet-App-Users';

export const name = 'Regular Web App';
export const description = 'Creates a regular web app that uses a database connection with a single user';

export const run = (accessTokens) =>
  // Create a regular web application
  createEntity('Client', 'client_id', '/api/v2/clients', accessTokens.v2, {
    name: 'My Sweet Web App',
    callbacks: [ 'http://localhost:3000/callback', 'http://jwt.io' ],
    app_type: 'regular_web'
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
    );
