import * as request from './request';
import { webtaskRegion } from './webtask';

const REQUIRED_ACCESS_TOKEN_SCOPES = [
  'read:groups', 'create:groups', 'update:groups',
  'read:roles', 'create:roles', 'update:roles',
  'read:permissions', 'create:permissions'
];

export function apiBaseUrl () {
  return `https://${process.env.RESETTENANT_AUTH0_TENANT}.${webtaskRegion()}.webtask.io/${process.env.RESETTENANT_AUTHZ_EXTENSION_ID}/api`;
}

export function tokenAudience () {
  return 'urn:auth0-authz-api';
}

export function fetchAccessToken (apiV2AccessToken) {
  const baseUrl = `https://${process.env.RESETTENANT_AUTH0_DOMAIN}/api/v2/client-grants`;

  // check to see if script client has required client grants
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
        // no grant record exists - create it
        return request.post({
          url: baseUrl,
          json: {
            client_id: process.env.RESETTENANT_NIC_CLIENT_ID,
            audience: tokenAudience(),
            scope: REQUIRED_ACCESS_TOKEN_SCOPES
          },
          auth: { bearer: apiV2AccessToken }
        }, 'create client grant for Authorization API');
      }

      // find any missing scopes
      const missingScopes = REQUIRED_ACCESS_TOKEN_SCOPES
        .filter(scope => grant.scope.indexOf(scope) === -1);
      // update grant with missing scopes
      if (missingScopes.length > 0) {
        return request.patch({
          url: `${baseUrl}/${grant.id}`,
          json: {
            scope: grant.scope.concat(missingScopes)
          },
          auth: { bearer: apiV2AccessToken }
        }, 'update client grant for Authorization API');
      }
    })
    .then(() => request.post({
      url: `https://${process.env.RESETTENANT_AUTH0_DOMAIN}/oauth/token`,
      json: {
        client_id: process.env.RESETTENANT_NIC_CLIENT_ID,
        client_secret: process.env.RESETTENANT_NIC_CLIENT_SECRET,
        grant_type: 'client_credentials',
        audience: tokenAudience()
      }
    }, 'obtain access token'))
    .then(body => body.access_token);
}

export function createEntity (entityName, idField, apiPath, accessToken, data) {
  return request.post({
    url: `${apiBaseUrl()}${apiPath}`,
    auth: { bearer: accessToken },
    json: data
  },
    `create ${entityName}`)
      .then((entity) => {
        console.log(`${entityName}: created ${entity[idField]}`);

        return entity;
      });
}

export function updateEntity (entityName, id, apiPath, subPath = '', accessToken, data, status) {
  return request.patch({
    url: `${apiBaseUrl()}${apiPath}/${id}${subPath}`,
    auth: { bearer: accessToken },
    json: data
  },
    `update ${entityName} ${id}`, status)
      .then((entity) => {
        console.log(`${entityName}: updated ${id}`);

        return entity;
      });
}

export function fetchEntity (entityName, id, apiPath, subPath = '', accessToken, data, status) {
  return request.get({
    url: `${apiBaseUrl()}${apiPath}/${id}${subPath}`,
    auth: { bearer: accessToken },
    json: true
  },
    `fetch ${entityName} ${id}`, status);
}
