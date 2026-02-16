import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import resolveShop from '../lib/resolve-shop.js';
import { syncTheme } from '../lib/sync-theme.js';

export default function registerInitCommand(program, api) {
  program
    .command('init')
    .description('Show a list of themes and download the selected one')
    .option('--shop <shopId>', 'Shop ID')
    .action(async (options) => {
      if (!api) {
        console.log(chalk.red('❌ Not logged in.'));
        console.log('Run: sellauth-theme login');
        return;
      }

      const spinner = ora();

      try {
        spinner.text = 'Resolving shop...';
        spinner.start();

        const shopId = await resolveShop(api, options.shop);

        spinner.text = 'Fetching themes...';

        const themes = await api.getThemes(shopId);

        const usableThemes = themes.filter((t) => t.id !== 0);

        if (!usableThemes.length) {
          spinner.fail('No themes found.');
          return;
        }

        spinner.stop();

        let selectedTheme;

        if (usableThemes.length === 1) {
          selectedTheme = usableThemes[0];
          console.log(chalk.gray(`Using theme: ${selectedTheme.name} (ID: ${selectedTheme.id})`));
        } else {
          const answer = await inquirer.prompt([
            {
              type: 'list',
              name: 'theme',
              message: 'Select a theme:',
              choices: usableThemes.map((t) => ({
                name: `${t.name} (ID: ${t.id})`,
                value: t,
              })),
            },
          ]);

          selectedTheme = answer.theme;
        }

        const baseDir = 'themes';
        const targetDir = path.resolve(baseDir, selectedTheme.id.toString());

        if (!fs.existsSync(baseDir)) {
          fs.mkdirSync(baseDir);
        }

        spinner.text = 'Pulling theme...';
        spinner.start();

        await syncTheme({
          api,
          shopId,
          themeId: selectedTheme.id,
          targetDir,
        });

        spinner.succeed('Theme initialized successfully.');

        console.log(chalk.green(`✔ Theme pulled into ${targetDir}`));
      } catch (error) {
        spinner.fail('Init failed.');
        console.log(chalk.red(error.response?.data?.message || error.message));
      }
    });
}
