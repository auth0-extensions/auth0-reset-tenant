import fs from 'fs';
import path from 'path';
import os from 'os';

const envFiles = [
  path.join(process.cwd(), '.env'),
  path.join(os.homedir(), '.auth0-reset-tenant-env')
];
export const envFile = envFiles.find(file => fs.existsSync(file));

if (!envFile)
  throw new Error('No env file found in the following locations: ' + envFiles.join(', '));

require('dotenv').config({ path: envFile });
