import fs from 'fs';
import path from 'path';

export default (name) => fs.readFileSync(
  path.join(__dirname, '../../templates', `${name}.html`),
  'utf8');
