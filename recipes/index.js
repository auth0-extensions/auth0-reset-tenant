import fs from 'fs';
import path from 'path';

const DEFAULT_ID = 'reset';

export default () => new Promise((resolve, reject) =>
  fs.readdir(__dirname, (err, files) => {
    if (err) return reject(err);

    const all = files
      .filter(f => f.endsWith('.js') && f !== 'index.js')
      .map(f => Object.assign(
        { id: /^(.*)\.js$/.exec(f)[1] },
        require(path.join(__dirname, f))));

    // return array with the default recipe always first
    const defaultRecipe = all.find(r => r.id === DEFAULT_ID);
    const otherRecipes = all.filter(r => r.id !== DEFAULT_ID);
    return resolve([ defaultRecipe ].concat(otherRecipes));
  })
);
