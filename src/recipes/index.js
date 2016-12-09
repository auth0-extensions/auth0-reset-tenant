const DEFAULT_ID = 'clear';

// obtain all recipes by running all strategies
export default strategies => 
  Promise.all(strategies.map(strategy => strategy()))
    .then(results => {
      // flatten array of arrays of recipes
      const all = results.reduce((p, c) => p.concat(c), []);

      // return all recipes with the default recipe always first
      const defaultRecipe = all.find(r => r.id === DEFAULT_ID);
      const otherRecipes = all.filter(r => r.id !== DEFAULT_ID);
      return [ defaultRecipe ].concat(otherRecipes);
    });
