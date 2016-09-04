import { createEntity } from '../lib/auth0';

const CLIENT_NAME = 'Default App';
const DB_CONNECTION_NAME = 'Username-Password-Authentication';

export default (accessTokens) => {
  console.log('** New Tenant **');
  console.log(`Creates an app called ${CLIENT_NAME} and a connection called ${DB_CONNECTION_NAME}`);

  // Create a regular web application
  return createEntity('Client', 'client_id', '/api/v2/clients', accessTokens.v2, {
    name: CLIENT_NAME
  })
    // Create DB connection
    .then(client =>
      createEntity('Connection', 'id', '/api/v2/connections', accessTokens.v2, {
        name: DB_CONNECTION_NAME,
        strategy: 'auth0',
        enabled_clients: [ client.client_id, process.env.API_CLIENT_ID ]
      })
    )
    // return the access tokens to the next recipe
    .then(() => accessTokens);
};
