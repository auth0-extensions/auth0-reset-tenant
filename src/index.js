import 'babel-polyfill';
import { envFile } from './lib/env';
import readline from 'readline';
import colors from 'colors/safe';
import pkg from '../package';
import recipes from './recipes';
import { externalFiles } from './recipes/strategies';
import builtinStrategy from './recipes/builtin';
import runner from './lib/runner';

function selectRecipes (allRecipies) {
  console.log('Recipes:');
  allRecipies.forEach((recipe, index) => {
    console.log(`${colors.green(index)}: [${recipe.selected ? colors.green('x') : ' '}] ${colors.green(recipe.name)}: ${recipe.description}`);
  });

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`Type the recipe index to toggle, ${colors.green('r')} to run, or ${colors.green('q')} to quit: `, (command) => {
      rl.close();

      if (command.toLowerCase() === 'q')
        return resolve();

      if (command.toLowerCase() === 'r')
        return resolve(allRecipies.filter(r => r.selected));

      const recipe = allRecipies[command];
      if (recipe) {
        recipe.selected = !recipe.selected;
      } else {
        console.log(colors.yellow('Unsupported command or invalid recipe index!'));
      }
      return resolve(selectRecipes(allRecipies));
    });
  });
}

// command line program:

const commandLineArgs = process.argv.slice(2);

console.log(`${colors.cyan(pkg.name)}, version ${pkg.version}`);
console.log(pkg.description);
console.log(`Target Auth0 domain: ${colors.yellow(process.env.AUTH0_DOMAIN)}`);
console.log(`[.env file: ${envFile}]`);
console.log();

// build strategies
const strategies = [ builtinStrategy ];
if (commandLineArgs.length > 0) {
  strategies.push(externalFiles(commandLineArgs));
}

recipes(strategies)
  .then(allRecipies => {
    // if no external recipes were provided, default the first recipe (the reset) to selected
    if (commandLineArgs.length === 0)
      allRecipies[0].selected = true;

    return allRecipies;
  })
  // prompt user to select which recipes to run
  .then(selectRecipes)
  .then(selectedRecipes => {
    if (!selectedRecipes)
      return console.log('Bye.');

    if (selectedRecipes.length === 0)
      return console.log(colors.yellow('No recipes to run.'));

    // run selected recipes
    const recipeNames = selectedRecipes.reduce((p, c) =>
      p + (p.length > 0 ? ', ' : '') + colors.green(c.name),
      '');
    console.log(`Running recipe(s): ${recipeNames}...`);
    console.log();
    return runner(selectedRecipes)
      .then(() => {
        console.log();
        console.log('Recipe run complete!');
      });
  })
  .catch((err) => console.error(colors.red('ERROR:', err)));
