import { createEntity } from '../lib/auth0';

export const name = 'New Tenant';
export const description = 'Creates all the elements in a new Auth0 Tenant';
export const managementApiClientGrantScopes = [ 
  'create:clients',
  'create:connections'
];

export const run = (accessTokens) =>
  // Create a regular web application
  createEntity('Client', 'client_id', '/api/v2/clients', accessTokens.v2, {
    name: 'Default App'
  })
    // Create DB connection
    .then(client =>
      Promise.all([
        createEntity('Connection', 'id', '/api/v2/connections', accessTokens.v2, {
          name: 'Username-Password-Authentication',
          strategy: 'auth0',
          enabled_clients: [ client.client_id ]
        }),
        createEntity('Connection', 'id', '/api/v2/connections', accessTokens.v2, {
          name: 'google-oauth2',
          strategy: 'google-oauth2',
          enabled_clients: [ client.client_id ]
        })
      ])
    );
