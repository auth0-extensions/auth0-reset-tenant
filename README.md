# Tenant Reset Extension

An Auth0 CLI tool/extension that can be used to reset an Auth0 tenant to a known set of artifacts, which is useful for demos and setting up quick test environments.

## Setup

This is not an extension yet, so to run it locally do the following:

### Prerequisites

1. Install Node v6  
  Example:
  ```bash
  nvm install 6
  ```

### Auth0 Setup

In the desired target Auth0 tenant, log into the Dashboard and:

1. Create a new **Non Interactive Client** that will represent this script (eg. `Tenant Reset Script`)
1. Authorize the client for the **Auth0 Management API** with the following grant scopes:  

  ```json
  [
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
    "read:device_credentials",
    "delete:device_credentials",
    "read:rules",
    "delete:rules",
    "delete:email_provider",
    "update:tenant_settings"
  ]
  ```

1. Obtain your Global Client ID and Secret from the [Account Settings > Advanced tab](https://manage.auth0.com/#/account/advanced)

### Global Setup

If you want to be able to run the script from _any_ directory on your machine:

1. Create a `.tenant-reset-env` file in your home directory and configure it as follows:  
  ```
  AUTH0_TENANT=foo
  AUTH0_DOMAIN=foo.auth0.com
  GLOBAL_CLIENT_ID=global-client-id
  GLOBAL_CLIENT_SECRET=global-client-secret
  API_CLIENT_ID=non-interactive-client-id
  API_CLIENT_SECRET=non-interactive-client-secret
  ```

1. Install the script globally by running this command from the repo directory:  
```bash
npm install -g
```

1. Run the script from any directory with this command:  
```bash
tenant-reset
```

### Local Setup

If you want to run the script from the repo directory (eg. you are developing a new feature):

1. Create a `.env` file in the repo directory, and configure it the same as the `.tenant-reset-env` file in [Global Setup](#global-setup)

1. Install dependencies, which also performs a build (see [Local Development](#local-development) section):  
```bash
npm install
```

1. Run the script:  
```bash
npm start
```

### Local Development

This script uses the [Babel.js](https://babeljs.io/) transpiler so it can take advantage of ECMA6 language features. Therefore the ECMA6 code in the [`src` directory](./src) needs to be compiled by Babel into JavaScript that Node.js can run. This is done by:

```bash
npm run build
```

Which creates a `dist` directory containing the compiled code, where `dist/index.js` is the starting point for the application. This is what the [`bin/tenant-reset` binary](bin/tenant-reset) and `npm start` are configured to run.
