import ora from 'ora';
import chalk from 'chalk';
import resolveShop from '../lib/resolve-shop.js';

export default function registerCreateCommand(program, api) {
  program
    .command('create')
    .description('Create a new theme')
    .option('--shop <shopId>', 'Shop ID (optional if only one shop exists)')
    .requiredOption('--name <name>', 'Theme name')
    .option('--template <templateId>', 'Official template ID (optional)')
    .action(async function (options) {
      const spinner = ora();

      try {
        if (!api) {
          console.log(chalk.red('❌ Not logged in.'));
          console.log('Run: sellauth-theme login');
          return;
        }

        spinner.start('Resolving shop...');

        const shopId = await resolveShop(api, options.shop);

        spinner.text = 'Creating theme...';

        const response = await api.createTheme(shopId, options.name, options.template);

        spinner.stop();

        if (!response.success) {
          console.log(chalk.red('❌ Failed to create theme.'));
          console.log(response.message || 'Unknown error.');
          return;
        }

        console.log(chalk.green('🎉 Theme created successfully!'));
        console.log(`Run the following command to pull the theme files:`);
        console.log(chalk.cyan(`sellauth-theme pull --theme ${response.theme.id}`));
      } catch (error) {
        if (spinner.isSpinning) spinner.stop();

        console.log(chalk.red('❌ Error creating theme.'));
        console.log(error.response?.data?.message || error.message);
      }
    });
}
