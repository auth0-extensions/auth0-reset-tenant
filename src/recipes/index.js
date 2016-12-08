import builtin from './builtin';

const DEFAULT_ID = 'clear';

export default strategies => {
  // add built-in recipe strategy
  strategies.push(builtin);

  // run all strategies - each will return an array of recipes
  return Promise.all(strategies.map(strategy => strategy()))
    .then(results => {
      // flatten array of arrays of recipes
      const all = results.reduce((p, c) => p.concat(c), []);

      // return all recipes with the default recipe always first
      const defaultRecipe = all.find(r => r.id === DEFAULT_ID);
      const otherRecipes = all.filter(r => r.id !== DEFAULT_ID);
      return [ defaultRecipe ].concat(otherRecipes);
    });
};
