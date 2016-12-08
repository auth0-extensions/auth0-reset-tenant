import fs from 'fs';
import path from 'path';

/* NOTE:
   The /templates folder must exist outside of /src because it won't be copied 
   by babel into the /dist folder because it doesn't contain .js files.
*/

export default (folder, name) => fs.readFileSync(
  path.join(__dirname, `../../../templates/${folder}`, `${name}.html`),
  'utf8');
