import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

// build list of possible config files, in their desired load order
const possibleConfigFiles = [
  // home config file, loaded first
  path.join(os.homedir(), '.auth0-reset-tenant-env'),
  // local config file will override anything in the home config
  path.join(process.cwd(), '.env')
];
export const configFiles = possibleConfigFiles.filter(file => fs.existsSync(file));

// merge config values from files
const mergedConfig = configFiles.reduce((previous, file) => {
  const config = dotenv.parse(fs.readFileSync(file));

  for (const key in config) {
    previous[key] = config[key];
  }  
  return previous;
}, {});

// apply to process.env, but only if not already set
// which is same behavior as dotenv.config()
for (const key in mergedConfig) {
  if (process.env[key] === undefined) {
    process.env[key] = mergedConfig[key];
  }
}

// essure that all required config keys were loaded either via env or files
const requiredConfigKeys = [
  'RESETTENANT_AUTH0_TENANT',
  'RESETTENANT_AUTH0_DOMAIN',
  'RESETTENANT_NIC_CLIENT_ID',
  'RESETTENANT_NIC_CLIENT_SECRET',
  'RESETTENANT_GLOBAL_CLIENT_ID',
  'RESETTENANT_GLOBAL_CLIENT_SECRET',
  'RESETTENANT_AUTHZ_EXTENSION_ID'
];
const missingConfigKeys = requiredConfigKeys.reduce((previous, key) => {
  if (process.env[key] === undefined) {
    previous.push(key);
  }
  return previous;
}, []);
if (missingConfigKeys.length > 0) {
  throw new Error(`The following required config values were not loaded: ${missingConfigKeys.join(', ')}`);
}
