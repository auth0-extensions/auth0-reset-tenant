import requestLib from 'request';
import util from 'util';
import querystring from 'querystring';
import fs from 'fs';
import path from 'path';

function wrapRequest (funcName, opts, successStatusCode, what) {
  return new Promise((resolve, reject) => requestLib[funcName](opts, (err, response, body) => {
    if (err) return reject(err);
    if (response.statusCode === 404) return resolve();
    if (response.statusCode !== successStatusCode) return reject(
      new Error(`Unsuccessful response attempting to ${what}: status=${response.statusCode}, body=
${typeof(body) === 'object' ? util.inspect(body) : body}`));

    resolve(body);
  }));
}

const request = {
  get: (opts, what) => wrapRequest('get', opts, 200, what),
  post: (opts, what) => wrapRequest('post', opts, 200, what),
  del: (opts, what) => wrapRequest('del', opts, 204, what),
  patch: (opts, what) => wrapRequest('patch', opts, 200, what),
  put: (opts, what) => wrapRequest('put', opts, 200, what)
};

const fetchAccessToken = (auth0Domain, clientId, clientSecret, audience) => {
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
};

function deleteEntities (manager, filter = () => true) {
  return manager.getAll()
    .then(entities => {
      const ids = entities
        .filter(filter)
        .map(entity => entity[manager.idField]);

      if (ids.length === 0)
        return console.log(`No ${manager.entityName}s to delete.`);

      console.log(`Deleting ${ids.length} ${manager.entityName}(s)...`);

      return ids.reduce((previous, id) =>
        previous.then(() => manager.delete(id)
          .then(() => console.log(`Deleted ${manager.entityName}:`, id))),
        Promise.resolve());
    });
}

function apiManager (entityName, idField, apiPath, accessToken, pager = getPage => getPage({})) {
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

function htmlTemplate (name) {
  return fs.readFileSync(
    path.join(__dirname, 'templates', `${name}.html`),
    'utf8');
}

function resetEmailTemplate (type, name, accessToken, settings) {
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
        if (!existing) return console.log(`Didn't reset ${name} settings because they don't exist yet`);

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
          .then(() => console.log(`Reset ${name} settings`));
      });
}

Promise.all([
  fetchAccessToken(process.env.AUTH0_DOMAIN, process.env.GLOBAL_CLIENT_ID, process.env.GLOBAL_CLIENT_SECRET),
  fetchAccessToken(process.env.AUTH0_DOMAIN, process.env.API_CLIENT_ID, process.env.API_CLIENT_SECRET, `https://${process.env.AUTH0_DOMAIN}/api/v2/`)
])
  .then(tokens => {
    const v1AccessToken = tokens[0];
    const v2AccessToken = tokens[1];
    console.log('Access tokens obtained.');

    return Promise.all([
      // Delete all users
      deleteEntities(
        apiManager('user', 'user_id', '/api/v2/users', v2AccessToken,
          getPage => {
            const fetchEntities = (entities, page) => {
              console.log(`[user page ${page}]`);

              return getPage({ per_page: 10, page })
                .then(pageEntities => pageEntities.length === 0 ?
                  entities :
                  fetchEntities(entities.concat(pageEntities), page + 1));
            };

            return fetchEntities([], 0);
          })),
      // Delete all clients except this one and the global client
      deleteEntities(
        apiManager('client', 'client_id', '/api/v2/clients', v2AccessToken),
        c => c.client_id !== process.env.API_CLIENT_ID && !c.global),
      // Delete all connections (should remove associated users)
      deleteEntities(
        apiManager('connection', 'id', '/api/v2/connections', v2AccessToken)),
      // Delete all rules
      deleteEntities(
        apiManager('rule', 'id', '/api/v2/rules', v2AccessToken)),
      // Delete all device credentials
      deleteEntities(
        apiManager('device credential', 'id', '/api/v2/device-credentials', v2AccessToken)),
      // Delete all resource servers
      deleteEntities(
        apiManager('resource server', 'id', '/api/v2/resource-servers', v2AccessToken),
        r => !r.is_system),
      // Delete client grants not accociated with this client
      deleteEntities(
        apiManager('client grant', 'id', '/api/v2/client-grants', v2AccessToken),
        g => g.client_id !== process.env.API_CLIENT_ID),
      // Delete the email provider
      request.del({
        url: `https://${process.env.AUTH0_DOMAIN}/api/v2/emails/provider`,
        auth: { bearer: v2AccessToken },
        json: true
      }, 'delete email provider')
        .then(() => console.log('Deleted email provider')),
      // Reset the tenant settings
      request.patch({
        url: `https://${process.env.AUTH0_DOMAIN}/api/v2/tenants/settings`,
        auth: { bearer: v2AccessToken },
        json: {
          change_password: {
            enabled: false,
            html: htmlTemplate('change_password')
          },
          error_page: {
            show_log_link: false,
            url: ''
          },
          flags: {
            change_pwd_flow_v1: false,
            enable_client_connections: true,
            enable_apis_section: true
          },
          friendly_name: '',
          picture_url: '',
          support_email: '',
          support_url: '',
          allowed_logout_urls: []
        }
      }, 'reset tenant settings')
        .then(() => console.log('Reset tenant settings')),
      // Reset login page
      request.patch({
        url: `https://${process.env.AUTH0_DOMAIN}/api/v2/clients/${process.env.GLOBAL_CLIENT_ID}`,
        auth: { bearer: v2AccessToken },
        json: {
          custom_login_page: htmlTemplate('login'),
          custom_login_page_on: false
        }
      }, 'reset custom login page')
        .then(() => console.log('Reset custom login page')),
      // Reset email templates
      resetEmailTemplate('verify_email', 'verification email', v1AccessToken, {
        disabled: false,
        resultUrl: '',
        urlLifetimeInSeconds: 432000
      }),
      resetEmailTemplate('welcome_email', 'welcome email', v1AccessToken, {
        disabled: true
      }),
      resetEmailTemplate('reset_email', 'change password email', v1AccessToken, {
        resultUrl: '',
        urlLifetimeInSeconds: 432000
      }),
      resetEmailTemplate('blocked_account', 'blocked account email', v1AccessToken, {
        resultUrl: '',
        urlLifetimeInSeconds: 432000
      }),
      resetEmailTemplate('stolen_credentials', 'password breach alert email', v1AccessToken, {})
    ]);
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
