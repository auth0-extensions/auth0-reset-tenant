import 'babel-polyfill';
import { envFile } from './lib/env';
import readline from 'readline';
import colors from 'colors/safe';
import pkg from '../package';
import recipes from './recipes';
import runner from './lib/runner';
import { exec } from 'child_process';
import path from 'path'; 
import { rmdir, mkdir, cp, ls } from './lib/fs';

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
console.log(`[command line args: ${commandLineArgs.length > 0 ? commandLineArgs : '(none)'}]`);
console.log();

const tempDir = path.join(__dirname, '_temp');
const tempSourceDir = path.join(tempDir, 'src');
const tempOutDir = path.join(tempDir, 'out');

function resetTempDirs () {
  return rmdir(tempDir).then(mkdir)
    .then(() => mkdir(tempSourceDir))
    .then(() => mkdir(tempOutDir));
}

const commandLineImportStrategy = () => {
  if (commandLineArgs.length === 0)
    return Promise.resolve([]);

  console.log('Importing external recipe files...');

  // reset temp directories
  return resetTempDirs()
    // copy all external recipe files specified in the command line to the internal temp source dir
    .then(() =>
      Promise.all(commandLineArgs.map(arg => {
        const importedSourceFile = path.join(tempSourceDir, path.basename(arg));

        return cp(arg, importedSourceFile);
      })))
    // compile them using babel
    .then(() => {
      const babel = path.join(__dirname, '../node_modules/.bin/babel');
      const command =`${babel} '${tempSourceDir}' -d '${tempOutDir}'`;

      return new Promise((resolve, reject) => 
        exec(command, (err, { cwd: tempSourceDir }, stdout, stderr) => {
          if (stdout)
            console.log('stdout:', stdout);
          if (stderr)
            console.error('stderr:', stderr);

          if (err) return reject(err);
          resolve();
        }));
    })
    // import them
    .then(() => ls(tempOutDir)
      .then(files => files.map(file => Object.assign(
        {
          id: '_imported_' + /^(.*)\.js$/.exec(file)[1],
          selected: true
        }, 
        require(path.join(tempOutDir, file))))));
};

recipes([ commandLineImportStrategy ])
  .then(allRecipies => {
    // default the first recipe (the reset) to selected
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
