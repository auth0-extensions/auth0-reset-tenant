import { fetchAccessToken } from './auth0';

export default (recipes, errorHandler) =>
  Promise.all([
    fetchAccessToken(process.env.AUTH0_DOMAIN, process.env.GLOBAL_CLIENT_ID, process.env.GLOBAL_CLIENT_SECRET),
    fetchAccessToken(process.env.AUTH0_DOMAIN, process.env.API_CLIENT_ID, process.env.API_CLIENT_SECRET, `https://${process.env.AUTH0_DOMAIN}/api/v2/`)
  ])
    .then(tokens => {
      const accessTokens = {
        v1: tokens[0],
        v2: tokens[1],
        webtask: process.env.WEBTASK_TOKEN
      };
      console.log('Access tokens obtained.');

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
    .catch(errorHandler);
