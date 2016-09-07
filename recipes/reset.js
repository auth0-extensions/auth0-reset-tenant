import * as request from '../lib/request';
import htmlTemplate from '../templates';
import { deleteEntities, apiManager, resetEmailTemplate } from '../lib/auth0';

export const name = 'Reset';
export const description = 'Removes all entities from the tenant and puts settings back to their defaults';

export const run = (accessTokens) => Promise.all([
  // Delete all users
  deleteEntities(
    apiManager('User', 'user_id', '/api/v2/users', accessTokens.v2,
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
  deleteEntities(
    apiManager('Client', 'client_id', '/api/v2/clients', accessTokens.v2),
    c => c.client_id !== process.env.API_CLIENT_ID && !c.global),
  // Delete all connections (should remove associated users)
  deleteEntities(
    apiManager('Connection', 'id', '/api/v2/connections', accessTokens.v2)),
  // Delete all rules
  deleteEntities(
    apiManager('Rule', 'id', '/api/v2/rules', accessTokens.v2)),
  // Delete all device credentials
  deleteEntities(
    apiManager('Device Credential', 'id', '/api/v2/device-credentials', accessTokens.v2)),
  // Delete all resource servers
  deleteEntities(
    apiManager('Resource Server', 'id', '/api/v2/resource-servers', accessTokens.v2),
    r => !r.is_system),
  // Delete client grants not accociated with this client
  deleteEntities(
    apiManager('Client Grant', 'id', '/api/v2/client-grants', accessTokens.v2),
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
        enable_apis_section: true
      },
      friendly_name: '',
      picture_url: '',
      support_email: '',
      support_url: '',
      allowed_logout_urls: []
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
  resetEmailTemplate('verify_email', 'Verification Email', accessTokens.v1, {
    disabled: false,
    resultUrl: '',
    urlLifetimeInSeconds: 432000
  }),
  resetEmailTemplate('welcome_email', 'Welcome Email', accessTokens.v1, {
    disabled: true
  }),
  resetEmailTemplate('reset_email', 'Change Password Email', accessTokens.v1, {
    resultUrl: '',
    urlLifetimeInSeconds: 432000
  }),
  resetEmailTemplate('blocked_account', 'Blocked Account Email', accessTokens.v1, {
    resultUrl: '',
    urlLifetimeInSeconds: 432000
  }),
  resetEmailTemplate('stolen_credentials', 'Password Breach Alert Email', accessTokens.v1, {})
]);
