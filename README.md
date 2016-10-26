# Auth0 Reset Tenant Extension

An Auth0 CLI tool/extension that can be used to reset an Auth0 tenant to a known set of artifacts, which is useful for demos and setting up quick test environments.

## Setup

This is not an extension yet, but you can run it locally as a CLI. Here's how:

### Auth0 Setup

In the desired target Auth0 tenant, log into the [Auth0 Dashboard](https://manage.auth0.com) and:

1. Create a new **Non Interactive Client** that will represent this script (eg. `Tenant Reset Script`)
1. Go to the [Management API Explorer](https://auth0.com/docs/api/management/v2) and use the **TOKEN GENERATOR** to create an API access token that has the `create:client_grants` scope
1. In a command terminal, create the following variables to be used in the next step:  
  ```bash
  APIV2_ACCESS_TOKEN=access-token-from-previous-step
  CLIENT_ID=non-interactive-client-id
  AUTH0_DOMAIN=yourtenant.auth0.com
  ```

1. Authorize the your client for the Auth0 Management API with this cURL call:  
  ```bash
  curl "https://$AUTH0_DOMAIN/api/v2/client-grants" \
    -X POST -H "Content-Type: application/json" \
    -H "Authorization: Bearer $APIV2_ACCESS_TOKEN" \
    -d '{
          "client_id": "'$CLIENT_ID'",
          "audience": "https://'$AUTH0_DOMAIN'/api/v2/",
          "scope": [
            "read:client_grants",
            "delete:client_grants",
            "read:users",
            "create:users",
            "delete:users",
            "read:clients",
            "delete:clients",
            "create:clients",
            "update:clients",
            "read:connections",
            "update:connections",
            "delete:connections",
            "create:connections",
            "read:resource_servers",
            "delete:resource_servers",
            "create:resource_servers",
            "read:device_credentials",
            "delete:device_credentials",
            "read:rules",
            "delete:rules",
            "delete:email_provider",
            "update:tenant_settings"
          ]
        }'
  ```

1. Obtain your Global Client ID and Secret from the [Account Settings > Advanced tab](https://manage.auth0.com/#/account/advanced)

### Global Setup

If you want to be able to run the script from _any_ directory on your machine:

1. Create a `.auth0-reset-tenant-env` file in your home directory and configure it as follows:  
  ```
  AUTH0_TENANT=yourtenant
  AUTH0_DOMAIN=yourtenant.auth0.com
  GLOBAL_CLIENT_ID=global-client-id
  GLOBAL_CLIENT_SECRET=global-client-secret
  API_CLIENT_ID=non-interactive-client-id
  API_CLIENT_SECRET=non-interactive-client-secret
  WEBTASK_TOKEN=your-tenant-webtask-token
  ```

  > `WEBTASK_TOKEN` is optional. Include it if you want the script to have access to your tenant's webtasks and extensions. To obtain the token, go to the desired tenant in the Auth0 Dashboard, then to Account Settings > [Webtasks](https://manage.auth0.com/#/account/webtasks) and copy it from the **Setup wt** step.

1. To install the script globally, directly from this GitHub repo:  
  ```bash
  npm install -g https://github.com/auth0-extensions/auth0-reset-tenant
  ```

1. Alternatively if you have cloned this repo to your machine, you can install the script globally by running this command from the repo directory:  
  ```bash
  npm install -g
  ```

1. Now you can run the script from any directory with this command:  
  ```bash
  reset-tenant
  ```

### Local Setup

If you want to run the script from the repo directory (eg. you are developing a new feature):

1. Create a `.env` file in the repo directory, and configure it the same as the `.auth0-reset-tenant-env` file in [Global Setup](#global-setup)
  > This step is optional if you already have a `.auth0-reset-tenant-env` file in your home directory

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
