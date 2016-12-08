import path from 'path';
import { exec } from 'child_process';

import { rmdir, mkdir, cp, ls } from '../lib/fs';

const tempSourceDir = path.join(__dirname, '_temp_src');
const tempOutDir = path.join(__dirname, '_temp_out');

function resetTempDirs () {
  return Promise.all([
    rmdir(tempSourceDir).then(mkdir),
    rmdir(tempOutDir).then(mkdir)
  ]);
}

// imports all recipe files in the specified directory
export const internalDirectory = (dirPath, predicate) => () =>
  ls(dirPath)
    .then(files => files
      .filter(file => file.endsWith('.js') && file !== 'index.js')
      .map(file => {
        const recipe = require(path.join(dirPath, file));

        recipe.id = /^(.*)\.js$/.exec(file)[1];
        if (predicate) predicate(recipe);

        return recipe;
      }));

// imports all specified external recipe files
export const externalFiles = filePaths => () => {
  console.log('Importing external recipe files...');

  return resetTempDirs()
    // copy all external recipe files to the internal temp source dir
    .then(() =>
      Promise.all(filePaths.map(arg => {
        const importedSourceFile = path.join(tempSourceDir, path.basename(arg));

        return cp(arg, importedSourceFile);
      })))
    // compile them using babel
    .then(() => {
      const babel = path.join(__dirname, '../../node_modules/.bin/babel');
      // use this to prevent babel from outputing absolute path of compiled file
      const relativeTempOutDir = path.relative(tempSourceDir, tempOutDir);
      const command =`${babel} . -d "${relativeTempOutDir}"`;

      return new Promise((resolve, reject) => 
        exec(command, { cwd: tempSourceDir }, (err, stdout, stderr) => {
          console.log(stdout);
          if (stderr)
            console.error('stderr:', stderr);

          if (err) return reject(err);
          resolve();
        }));
    })
    // import them using internalDirectory strategy
    .then(() => internalDirectory(tempOutDir, recipe => {
      recipe.id = `IMPORTED_${recipe.id}`;
      recipe.selected = true;
    })());
};
