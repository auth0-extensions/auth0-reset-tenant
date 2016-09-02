# Tenant Reset Extension

An Auth0 extension that will reset the current tenant to default artifacts, which is useful for demos and setting up quick test environments.

This is not an extension yet, so to run it locally do the following:

## Setup

In the desired Auth0 tenant, log into the Dashboard and:

1. Install Node v6  
  Example:
  ```bash
  nvm install 6
  ```

1. Create a new **Non Interactive Client** that will represent this script (eg. `Tenant Reset Script`)
1. Authorize the client for the **Auth0 Management API** with the following grants:  

  ```json
  [
    "read:client_grants",
    "delete:client_grants",
    "read:users",
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

1. Create a `.env` file in the same directory as this repo, and configure it as follows:  

  ```
  AUTH0_TENANT=foo
  AUTH0_DOMAIN=foo.auth0.com
  GLOBAL_CLIENT_ID=global-client-id
  GLOBAL_CLIENT_SECRET=global-client-secret
  API_CLIENT_ID=non-interactive-client-id
  API_CLIENT_SECRET=non-interactive-client-secret
  ```

## Run

Run the script using the following command:

```bash
node index.js
```
