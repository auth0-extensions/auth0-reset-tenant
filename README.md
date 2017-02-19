# Auth0 Reset Tenant Extension

An Auth0 CLI tool/extension that can be used to reset an Auth0 tenant to a known set of entities (clients, connections, users, etc), which is useful for demos and setting up quick test environments.

The `reset-tenant` script loads up a set of pre-built **recipes** (or you can provide your own custom recipe) that you can execute against a specified Auth0 tenant. Often times this involves first deleting all of the entities within that tenant and rebuilding it with the set of entities defined in the recipes.

## Setup

This is not an extension yet, but you can run it locally as a CLI. Here's how:

### Auth0 Setup

For a tenant to be used by the script, you must first log into the [Auth0 Dashboard](https://manage.auth0.com) and:

1. Create a new **Non Interactive Client** that will represent this script. Name it something like: `auth0-reset-tenant`
1. Authorize the client for the **Auth0 Management API** and enable the `read:client_grants` and `update:client_grants` scopes
1. You will also need to obtain your Global Client ID and Secret from the [Account Settings > Advanced tab](https://manage.auth0.com/#/account/advanced)

### Configuration

To run the script on your machine, configuration is required that tells it what Auth0 tenant to work against as well as other information related to that tenant. To load this configuration the `reset-tenant` script will first look for a `.env` file located in the _current directory_. If one doesn't exist, it will then look for or a `.auth0-reset-tenant-env` file in your _home directory_. 

Using a local `.env` file is useful when you're working on a particular project (eg. a website that uses Auth0) that's associated with a specific Auth0 tenant. You typically have a custom **recipe** script located in that same project that will be used to set up the tenant for the project. The custom recipt can be treated as code and committed to source control just like any other code file in the project.

The `.auth0-reset-tenant-env` file is useful when you have a common Auth0 tenant that you use for more generic testing or demos that you want to be able to run from any directory.

Regardless, the configuration file requires the following name/value pairs:

```
RESETTENANT_AUTH0_TENANT=yourtenant
RESETTENANT_AUTH0_DOMAIN=yourtenant.auth0.com
RESETTENANT_NIC_CLIENT_ID=non-interactive-client-id
RESETTENANT_NIC_CLIENT_SECRET=non-interactive-client-secret
RESETTENANT_GLOBAL_CLIENT_ID=global-client-id
RESETTENANT_GLOBAL_CLIENT_SECRET=global-client-secret
RESETTENANT_WEBTASK_TOKEN=your-tenant-webtask-token
RESETTENANT_AUTHZ_EXTENSION_ID=adf6e2f2b84784b57522e3b19dfc9201
```

> `RESETTENANT_WEBTASK_TOKEN` is optional. Include it if you want the script to have access to your tenant's webtasks and extensions. To obtain the token, go to the desired tenant in the Auth0 Dashboard, then to Account Settings > [Webtasks](https://manage.auth0.com/#/account/webtasks) and copy it from the **Setup wt** step.

### Global Setup

This script is not registered in `npm`, but you can install it as global command directly from this repo like this:

```bash
npm install -g https://github.com/auth0-extensions/auth0-reset-tenant
```

Alternatively if you have cloned this repo to your machine, you can install the script globally by running this command from the repo directory:

```bash
npm install -g
```

Now as long as there's a [configuration](#configuration) file available, you can run the script with this command:

```bash
reset-tenant
```

### Local Setup

If you want to run the script from the repo directory (eg. you are developing a new feature):

1. Create a local `.env` [configuration](#configuration) file in the repo directory (or fallback to the `.auth0-reset-tenant-env` file in your home directory).

1. Install dependencies, which also performs a build (see [Build](#build)):

   ```bash
   npm install
   ```

1. Run the script:
  
   ```bash
   npm start
   ```

### Local Development

#### Build

This script uses the [Babel.js](https://babeljs.io/) transpiler so it can take advantage of ECMA6 language features. Therefore the ECMA6 code in the [`src` directory](./src) needs to be compiled by Babel into JavaScript that Node.js can run. This is done by:

```bash
npm run build
```

Which creates a `dist` directory containing the compiled code, where `dist/index.js` is the starting point for the application. This is what the [`bin/reset-tenant` binary](bin/reset-tenant) and `npm start` are configured to run.

#### Node Version

This project contains an [`.nvmrc` file](./.nvmrc), which will set your current version of Node to the one that Auth0 webtasks/extensions are compatible with, if you run this command:

```bash
nvm use
```

## Building your own Recipes

It can be very useful to craft your own recipe scripts for use with your projects that use Auth0. You can then include these receipes along with your other source code so they make an easy way to configure a tenant from scratch so it works with your application code in a repeatable fashion.

To create your own receipe, simply create a `.js` file in ECMA6 syntax with the following exports:

```js
export const name = 'Friendly name of your recipe';
export const description = 'A description of what it does';
// an array of Auth0 Management API scopes that are required by your recipe to run
export const managementApiClientGrantScopes = [ 
  'create:clients',
  'create:connections'
];

export const run = accessTokens => {
   // your receipe code here, which ultimately must return a promise
};
```

The `accessTokens` argument contains an object with all the API access tokens you'll need to run your recipe, which include:

* `accessTokens.v2`: An Auth0 Management API access token with at least the scopes you specified in the `managementApiClientGrantScopes` export
* `accessTokens.v1`: An Auth0 Management API v1 access token for the handful of operations you might need to do there
* `accessTokens.webtask`: The webtask token you specified in `RESETTENANT_AUTHZ_EXTENSION_ID` setting of your configuration file (if it was provided)

You can then run your custom recipe like this:

```bash
reset-tenant ./your-recipe.js
```

For examples of recipes, take a look at the [/src/recipes/builtin](/src/recipes/builtin) directory.
