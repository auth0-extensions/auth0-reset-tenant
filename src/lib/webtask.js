import * as request from './request';
import querystring from 'querystring';

const rootUrl = `https://sandbox.it.auth0.com/api/webtask/${process.env.AUTH0_TENANT}`;

export function apiManager (accessToken, pager = getPage => getPage({})) {
  return {
    entityName: 'Webtask',
    idField: 'name',
    getAll: () => {
      const getPage = (params) => request.get({
        url: `${rootUrl}?${querystring.stringify(params)}`,
        auth: { bearer: accessToken },
        json: true
      }, 'fetch webtasks');
      return pager(getPage);
    },
    delete: id => request.del({
      url: `${rootUrl}/${id}`,
      auth: { bearer: accessToken },
      json: true
    }, 'delete webtask')
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
