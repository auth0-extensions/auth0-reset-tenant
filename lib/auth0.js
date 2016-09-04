import * as request from './request';
import querystring from 'querystring';
import htmlTemplate from '../templates';

export function fetchAccessToken (auth0Domain, clientId, clientSecret, audience) {
  return request.post({
    url: `https://${auth0Domain}/oauth/token`,
    json: {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      audience: audience
    }
  }, 'obtain access token')
    .then(body => body.access_token);
}

export function deleteEntities (manager, filter = () => true) {
  return manager.getAll()
    .then(entities => {
      const ids = entities
        .filter(filter)
        .map(entity => entity[manager.idField]);

      if (ids.length === 0)
        return console.log(`${manager.entityName}s: nothing to delete`);

      console.log(`${manager.entityName}s: deleting ${ids.length} entity(ies)...`);

      return ids.reduce((previous, id) =>
        previous.then(() => manager.delete(id)
          .then(() => console.log(`${manager.entityName}s: deleted ${id}`))),
        Promise.resolve());
    });
}

export function apiManager (entityName, idField, apiPath, accessToken, pager = getPage => getPage({})) {
  return {
    entityName,
    idField,
    getAll: () => {
      const getPage = (params) => request.get({
        url: `https://${process.env.AUTH0_DOMAIN}${apiPath}?${querystring.stringify(params)}`,
        auth: { bearer: accessToken },
        json: true
      }, `fetch ${entityName}s`);
      return pager(getPage);
    },
    delete: id => request.del({
      url: `https://${process.env.AUTH0_DOMAIN}${apiPath}/${id}`,
      auth: { bearer: accessToken },
      json: true
    }, `delete ${entityName}`)
  };
}

export function resetEmailTemplate (type, name, accessToken, settings) {
  const url = `https://${process.env.AUTH0_DOMAIN}/api/emails/${type}`;
  const auth = { bearer: accessToken };

  // make sure email template exists
  return request.get({
    url,
    auth,
    json: true
  },
    `check for existing ${type} settings`)
      .then(existing => {
        if (!existing) return console.log(`${name} Settings: do not exist yet`);

        // it exists, so reset it
        return request.put({
          url,
          auth,
          json: Object.assign({
            tenant: process.env.AUTH0_TENANT,
            from: '',
            subject: '',
            body: htmlTemplate(type),
            syntax: 'liquid'
          }, settings)
        },
        `reset ${type} settings`)
          .then(() => console.log(`${name} Settings: reset`));
      });
}

export function createEntity (entityName, idField, apiPath, accessToken, data) {
  return request.post({
    url: `https://${process.env.AUTH0_DOMAIN}${apiPath}`,
    auth: { bearer: accessToken },
    json: data
  },
    `create ${entityName}`)
      .then((entity) => {
        console.log(`${entityName}: created ${entity[idField]}`);

        return entity;
      });
}

export function updateEntity (entityName, id, apiPath, accessToken, data) {
  return request.patch({
    url: `https://${process.env.AUTH0_DOMAIN}${apiPath}/${id}`,
    auth: { bearer: accessToken },
    json: data
  },
    `update ${entityName} ${id}`)
      .then((entity) => {
        console.log(`${entityName}: updated ${id}`);

        return entity;
      });
}
