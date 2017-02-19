import { tokenAudience, fetchAccessToken } from '../recipes/lib/auth0';

export default (recipes, errorHandler) =>
  Promise.all([
    fetchAccessToken(process.env.RESETTENANT_AUTH0_DOMAIN, process.env.RESETTENANT_GLOBAL_CLIENT_ID, process.env.RESETTENANT_GLOBAL_CLIENT_SECRET),
    fetchAccessToken(process.env.RESETTENANT_AUTH0_DOMAIN, process.env.RESETTENANT_NIC_CLIENT_ID, process.env.RESETTENANT_NIC_CLIENT_SECRET, tokenAudience())
  ])
    .then(tokens => {
      const accessTokens = {
        v1: tokens[0],
        v2: tokens[1],
        webtask: process.env.RESETTENANT_WEBTASK_TOKEN
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
