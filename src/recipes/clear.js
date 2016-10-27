import * as request from '../lib/request';
import htmlTemplate from '../lib/templates';
import * as auth0 from '../lib/auth0';
import * as webtask from '../lib/webtask';

export const name = 'Clear';
export const description = 'Removes all entities from the tenant (including webtasks/extensions) and puts settings back to their defaults';

export const run = (accessTokens) => Promise.all([
  // Delete all users
  auth0.deleteEntities(
    auth0.apiManager('User', 'user_id', '/api/v2/users', accessTokens.v2,
      getPage => {
        const fetchEntities = (entities, page) => {
          console.log(`Users: [page ${page}]`);

          return getPage({ per_page: 10, page })
            .then(pageEntities => pageEntities.length === 0 ?
              entities :
              fetchEntities(entities.concat(pageEntities), page + 1));
        };

        return fetchEntities([], 0);
      })),
  // Delete all clients except this one and the global client
  auth0.deleteEntities(
    auth0.apiManager('Client', 'client_id', '/api/v2/clients', accessTokens.v2),
    c => c.client_id !== process.env.API_CLIENT_ID && !c.global),
  // Delete all connections (should remove associated users)
  auth0.deleteEntities(
    auth0.apiManager('Connection', 'id', '/api/v2/connections', accessTokens.v2)),
  // Delete all rules
  auth0.deleteEntities(
    auth0.apiManager('Rule', 'id', '/api/v2/rules', accessTokens.v2)),
  // Delete all device credentials
  auth0.deleteEntities(
    auth0.apiManager('Device Credential', 'id', '/api/v2/device-credentials', accessTokens.v2)),
  // Delete all APIs
  auth0.deleteEntities(
    auth0.apiManager('API', 'id', '/api/v2/resource-servers', accessTokens.v2),
    r => !r.is_system),
  // Delete client grants not accociated with this client
  auth0.deleteEntities(
    auth0.apiManager('Client Grant', 'id', '/api/v2/client-grants', accessTokens.v2),
    g => g.client_id !== process.env.API_CLIENT_ID),
  // Delete the email provider
  request.del({
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/emails/provider`,
    auth: { bearer: accessTokens.v2 },
    json: true
  }, 'delete email provider')
    .then(() => console.log('Custom Email Provider: deleted')),
  // Reset the tenant settings
  request.patch({
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/tenants/settings`,
    auth: { bearer: accessTokens.v2 },
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
        enable_apis_section: true,
        enable_pipeline2: true
      },
      friendly_name: '',
      picture_url: '',
      support_email: '',
      support_url: '',
      allowed_logout_urls: [],
      default_audience: ''
    }
  }, 'reset tenant settings')
    .then(() => console.log('Tenant Settings: reset')),
  // Reset login page
  request.patch({
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/clients/${process.env.GLOBAL_CLIENT_ID}`,
    auth: { bearer: accessTokens.v2 },
    json: {
      custom_login_page: htmlTemplate('login'),
      custom_login_page_on: false
    }
  }, 'reset custom login page')
    .then(() => console.log('Custom Login Page: reset')),
  // Reset email templates
  auth0.resetEmailTemplate('verify_email', 'Verification Email', accessTokens.v1, {
    disabled: false,
    resultUrl: '',
    urlLifetimeInSeconds: 432000
  }),
  auth0.resetEmailTemplate('welcome_email', 'Welcome Email', accessTokens.v1, {
    disabled: true
  }),
  auth0.resetEmailTemplate('reset_email', 'Change Password Email', accessTokens.v1, {
    resultUrl: '',
    urlLifetimeInSeconds: 432000
  }),
  auth0.resetEmailTemplate('blocked_account', 'Blocked Account Email', accessTokens.v1, {
    resultUrl: '',
    urlLifetimeInSeconds: 432000
  }),
  auth0.resetEmailTemplate('stolen_credentials', 'Password Breach Alert Email', accessTokens.v1, {}),
  // Delete all webtasks
  accessTokens.webtask ?
    webtask.deleteEntities(webtask.apiManager(accessTokens.webtask)) :
    Promise.resolve()
]);
