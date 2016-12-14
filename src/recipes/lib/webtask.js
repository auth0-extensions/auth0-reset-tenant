import * as request from './request';
import querystring from 'querystring';

export function webtaskRegion () {
  const regionMatch = /^\S*\.(\S*)\.auth0\.com$/.exec(process.env.AUTH0_DOMAIN);
  return regionMatch ? regionMatch[1] : 'us';
}

export function apiManager (entityName, idField, apiPath, accessToken, pager = getPage => getPage({})) {
  const region = webtaskRegion();
  const apiRegion = region === 'us' ? '' : `-${region}`;
  const rootUrl = `https://sandbox${apiRegion}.it.auth0.com${apiPath}/${process.env.AUTH0_TENANT}`;

  return {
    entityName,
    idField,
    getAll: () => {
      const getPage = (params) => request.get({
        url: `${rootUrl}?${querystring.stringify(params)}`,
        auth: { bearer: accessToken },
        json: true
      }, `fetch ${entityName}s`);
      return pager(getPage);
    },
    delete: id => request.del({
      url: `${rootUrl}/${id}`,
      auth: { bearer: accessToken },
      json: true
    }, `delete ${entityName}`)
  };
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
