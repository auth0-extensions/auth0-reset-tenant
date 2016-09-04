import * as request from './lib/request';
import htmlTemplate from './templates';
import { fetchAccessToken, deleteEntities, apiManager, resetEmailTemplate } from './lib/auth0';

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
        apiManager('User', 'user_id', '/api/v2/users', v2AccessToken,
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
        apiManager('Client', 'client_id', '/api/v2/clients', v2AccessToken),
        c => c.client_id !== process.env.API_CLIENT_ID && !c.global),
      // Delete all connections (should remove associated users)
      deleteEntities(
        apiManager('Connection', 'id', '/api/v2/connections', v2AccessToken)),
      // Delete all rules
      deleteEntities(
        apiManager('Rule', 'id', '/api/v2/rules', v2AccessToken)),
      // Delete all device credentials
      deleteEntities(
        apiManager('Device Credential', 'id', '/api/v2/device-credentials', v2AccessToken)),
      // Delete all resource servers
      deleteEntities(
        apiManager('Resource Server', 'id', '/api/v2/resource-servers', v2AccessToken),
        r => !r.is_system),
      // Delete client grants not accociated with this client
      deleteEntities(
        apiManager('Client Grant', 'id', '/api/v2/client-grants', v2AccessToken),
        g => g.client_id !== process.env.API_CLIENT_ID),
      // Delete the email provider
      request.del({
        url: `https://${process.env.AUTH0_DOMAIN}/api/v2/emails/provider`,
        auth: { bearer: v2AccessToken },
        json: true
      }, 'delete email provider')
        .then(() => console.log('Custom Email Provider: deleted')),
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
        .then(() => console.log('Tenant Settings: reset')),
      // Reset login page
      request.patch({
        url: `https://${process.env.AUTH0_DOMAIN}/api/v2/clients/${process.env.GLOBAL_CLIENT_ID}`,
        auth: { bearer: v2AccessToken },
        json: {
          custom_login_page: htmlTemplate('login'),
          custom_login_page_on: false
        }
      }, 'reset custom login page')
        .then(() => console.log('Custom Login Page: reset')),
      // Reset email templates
      resetEmailTemplate('verify_email', 'Verification Email', v1AccessToken, {
        disabled: false,
        resultUrl: '',
        urlLifetimeInSeconds: 432000
      }),
      resetEmailTemplate('welcome_email', 'Welcome Email', v1AccessToken, {
        disabled: true
      }),
      resetEmailTemplate('reset_email', 'Change Password Email', v1AccessToken, {
        resultUrl: '',
        urlLifetimeInSeconds: 432000
      }),
      resetEmailTemplate('blocked_account', 'Blocked Account Email', v1AccessToken, {
        resultUrl: '',
        urlLifetimeInSeconds: 432000
      }),
      resetEmailTemplate('stolen_credentials', 'Password Breach Alert Email', v1AccessToken, {})
    ]);
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
