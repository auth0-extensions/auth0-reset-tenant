import { tokenAudience, fetchAccessToken } from '../recipes/lib/auth0';
import * as request from '../recipes/lib/request';
import colors from 'colors/safe';

const MINIMUM_MANAGEMENT_API_CLIENT_GRANT_SCOPES = [
  'read:client_grants', 
  'update:client_grants' 
];

function getRequiredClientGrantScopes (recipes) {
  return recipes.reduce((previous, current) => {
    const newScopes = [];
    current.managementApiClientGrantScopes.forEach(scope => {
      if (!previous.includes(scope)) {
        newScopes.push(scope);
      }
    });

    return previous.concat(newScopes);
  }, MINIMUM_MANAGEMENT_API_CLIENT_GRANT_SCOPES);
}

function updateClientGrantScopesForManagementApi (scopes, apiV2AccessToken) {
  const baseUrl = `https://${process.env.RESETTENANT_AUTH0_DOMAIN}/api/v2/client-grants`;

  return request.get({
    url: baseUrl,
    json: true,
    auth: { bearer: apiV2AccessToken }
  }, 'get existing client grants')
    .then(grants => {
      const grant = grants.find(g =>
        g.client_id === process.env.RESETTENANT_NIC_CLIENT_ID &&
        g.audience === tokenAudience());
      if (!grant) {
        throw new Error(`Non Interactive Client (Client ID=${process.env.RESETTENANT_NIC_CLIENT_ID}) does not have a grant record for the Auth0 Management API.`);
      }

      return request.patch({
        url: `${baseUrl}/${grant.id}`,
        json: { scope: scopes },
        auth: { bearer: apiV2AccessToken }
      }, 'update client grants for Management API');
    });
}

export default (recipes, errorHandler) =>
  Promise.all([
    fetchAccessToken(
      process.env.RESETTENANT_AUTH0_DOMAIN, 
      process.env.RESETTENANT_GLOBAL_CLIENT_ID, 
      process.env.RESETTENANT_GLOBAL_CLIENT_SECRET),
    fetchAccessToken(
      process.env.RESETTENANT_AUTH0_DOMAIN, 
      process.env.RESETTENANT_NIC_CLIENT_ID, 
      process.env.RESETTENANT_NIC_CLIENT_SECRET, 
      tokenAudience())
  ])
    .then(tokens => {
      const accessTokens = {
        v1: tokens[0],
        v2: tokens[1],
        webtask: process.env.RESETTENANT_WEBTASK_TOKEN
      };

      console.log('Initial access tokens obtained.');

      // temporarily update the NIC's client grants to include all grants specified by the recipes
      const requiredScopes = getRequiredClientGrantScopes(recipes);

      return updateClientGrantScopesForManagementApi(requiredScopes, accessTokens.v2)
        .then(() => {
          console.log('Reset Tenant\'s client grant modified with Management API scopes required by the selected recipes:');
          console.log(colors.cyan(requiredScopes.join(', ')));
        })
        // obtain new v2 access token which has updated scopes
        .then(() => fetchAccessToken(
          process.env.RESETTENANT_AUTH0_DOMAIN, 
          process.env.RESETTENANT_NIC_CLIENT_ID, 
          process.env.RESETTENANT_NIC_CLIENT_SECRET, 
          tokenAudience()))
        .then(newApiV2AccessToken => {
          accessTokens.v2 = newApiV2AccessToken;

          console.log('Updated access tokens obtained.');

          // run selected recipes
          return recipes.reduce((previous, current) => {
            return previous.then(() => {
              console.log();
              console.log(current.name);
              console.log('-'.repeat(current.name.length));

              return current.run(accessTokens);
            });
          }, Promise.resolve());
        })
        // reset NIC's client grants back to default
        .then(() => updateClientGrantScopesForManagementApi(
          MINIMUM_MANAGEMENT_API_CLIENT_GRANT_SCOPES, 
          accessTokens.v2))
        .then(() => {
          console.log('Reset Tenant\'s client grant returned to minimum Management API scopes:');
          console.log(colors.cyan(MINIMUM_MANAGEMENT_API_CLIENT_GRANT_SCOPES.join(', ')));
        });
    })
    .catch(errorHandler);
