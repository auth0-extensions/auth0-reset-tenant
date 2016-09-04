import { createEntity } from '../lib/auth0';

const DB_CONNECTION_NAME = 'Sweet-App-Users';

export default (accessTokens) => {
  console.log('** Regular Web App **');
  console.log('Creates a regular web app, connection, and single user');

  // Create a regular web application
  return createEntity('Client', 'client_id', '/api/v2/clients', accessTokens.v2, {
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
    )
    // Add a single user
    .then(() =>
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
    )
    // return the access tokens to the next recipe
    .then(() => accessTokens);
};
