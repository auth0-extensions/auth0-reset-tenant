import { createEntity, updateEntity } from '../lib/auth0';

const DB_CONNECTION_NAME = 'Username-Password-Authentication';

export const name = 'Demo: Multi-tenant Website Sample';
export const description = 'Performs the Auth0 setup for the sample: https://github.com/auth0-samples/auth0-multitenant-website';

export const run = (accessTokens) =>
  // Create a regular web application
  createEntity('Client', 'client_id', '/api/v2/clients', accessTokens.v2, {
    name: 'Multi-Tenant Website',
    callbacks: [ 'http://yourcompany.com:3000/callback' ],
    app_type: 'regular_web',
    client_metadata: {
      required_roles: 'Tenant User'
    }
  })
    // Create DB connection
    .then(client =>
      createEntity('Connection', 'id', '/api/v2/connections', accessTokens.v2, {
        name: DB_CONNECTION_NAME,
        strategy: 'auth0',
        enabled_clients: [ client.client_id, process.env.RESETTENANT_NIC_CLIENT_ID ]
      })
      .then(connection =>
        Promise.all([
          // Add users
          createEntity('User', 'user_id', '/api/v2/users', accessTokens.v2, {
            connection: DB_CONNECTION_NAME,
            email: 'user1@example.com',
            password: 'pw',
            user_metadata: {
              name: 'User 1'
            }
          }),
          createEntity('User', 'user_id', '/api/v2/users', accessTokens.v2, {
            connection: DB_CONNECTION_NAME,
            email: 'user2@example.com',
            password: 'pw',
            user_metadata: {
              name: 'User 2'
            }
          }),
          createEntity('User', 'user_id', '/api/v2/users', accessTokens.v2, {
            connection: DB_CONNECTION_NAME,
            email: 'user3@example.com',
            password: 'pw',
            user_metadata: {
              name: 'User 3'
            }
          }),
          createEntity('User', 'user_id', '/api/v2/users', accessTokens.v2, {
            connection: DB_CONNECTION_NAME,
            email: 'user4@example.com',
            password: 'pw',
            user_metadata: {
              name: 'User 4'
            }
          }),

          // add application authorization rule
          createEntity('Rule', 'id', '/api/v2/rules', accessTokens.v2, {
            name: 'authorize-applications',
            script: 
`function (user, context, callback) {
  context.clientMetadata = context.clientMetadata || {};
  if (context.clientMetadata.required_roles && context.clientMetadata.required_roles.length){
    if (user.roles) {
      var _ = require('lodash');
      var roles = context.clientMetadata.required_roles.split(',');
      var matchingRoles =_.filter(user.roles, function(roleName) {
        return _.includes(roles, roleName);
      });

      if (matchingRoles && matchingRoles.length) {
        return callback(null, user, context);
      }
    }

    return callback(new UnauthorizedError('You do not have the required role to access ' + context.clientName));
  }

 callback(null, user, context);
}`
          })          
        ])
        // remove RESETTENANT_NIC_CLIENT_ID from the connection's enabled clients
        .then(() =>
          updateEntity('Connection', connection.id, '/api/v2/connections', accessTokens.v2, {
            enabled_clients: [ client.client_id ]
          })
        )
      )
    );
