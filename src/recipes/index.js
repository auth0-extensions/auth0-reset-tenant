import fs from 'fs';
import path from 'path';

const DEFAULT_ID = 'clear';

const currentDirectoryStrategy = () => 
  new Promise((resolve, reject) =>
    fs.readdir(__dirname, (err, files) => {
      if (err) return reject(err);

      const recipes = files
        .filter(f => f.endsWith('.js') && f !== 'index.js')
        .map(f => Object.assign(
          { id: /^(.*)\.js$/.exec(f)[1] },
          require(path.join(__dirname, f))));

      resolve(recipes);
    }));

export default strategies => {
  // add current directory strategy to passed list
  strategies = strategies || [];
  strategies.push(currentDirectoryStrategy);

  // run strategies
  return Promise.all(strategies.map(s => s()))
    .then(results => {
      const all = results.reduce((p, c) => p.concat(c), []);

      // return all recipes with the default recipe always first
      const defaultRecipe = all.find(r => r.id === DEFAULT_ID);
      const otherRecipes = all.filter(r => r.id !== DEFAULT_ID);
      return [ defaultRecipe ].concat(otherRecipes);
    });
};
