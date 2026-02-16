import chalk from 'chalk';
import ora from 'ora';
import resolveShop from '../lib/resolve-shop.js';

export default function registerApplyCommand(program, api) {
  program
    .command('apply')
    .description('Apply a theme to a shop')
    .requiredOption('--theme <themeId>', 'Theme ID')
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

        spinner.text = 'Applying theme...';

        const response = await api.applyTheme(shopId, options.theme);

        if (!response.success) {
          spinner.fail('Failed to apply theme.');
          console.log(chalk.red(response.message || 'Unknown error.'));
          return;
        }

        spinner.succeed('Theme applied successfully.');

        console.log(chalk.green(`✔ Theme ${options.theme} is now active on shop ${shopId}`));
      } catch (error) {
        spinner.fail('Apply failed.');
        console.log(chalk.red(error.response?.data?.message || error.message));
      }
    });
}
