import { fetchAccessToken } from './lib/auth0';
import reset from './recipes/reset';
import regularWebApp from './recipes/regular_web_app';

Promise.all([
  fetchAccessToken(process.env.AUTH0_DOMAIN, process.env.GLOBAL_CLIENT_ID, process.env.GLOBAL_CLIENT_SECRET),
  fetchAccessToken(process.env.AUTH0_DOMAIN, process.env.API_CLIENT_ID, process.env.API_CLIENT_SECRET, `https://${process.env.AUTH0_DOMAIN}/api/v2/`)
])
  .then(tokens => {
    const accessTokens = {
      v1: tokens[0],
      v2: tokens[1]
    };
    console.log('Access tokens obtained.');

    // run recipies
    return reset(accessTokens)
      .then(regularWebApp);

  })
  .catch(err => {
    console.error('ERROR:', err);
  });
