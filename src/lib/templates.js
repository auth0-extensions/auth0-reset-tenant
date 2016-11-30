import fs from 'fs';
import path from 'path';

export default (folder, name) => fs.readFileSync(
  path.join(__dirname, `../../templates/${folder}`, `${name}.html`),
  'utf8');
