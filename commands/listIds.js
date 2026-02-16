import chalk from 'chalk';
import ora from 'ora';

export default function registerListCommand(program, api) {
  program
    .command('list-ids')
    .description('List your shops and their themes')
    .action(async () => {

      if (!api) {
        console.log(chalk.red('❌ Not logged in.'));
        console.log('Run: sellauth-theme login');
        return;
      }

      const spinner = ora('Fetching shops...').start();

      try {
        const shops = await api.getShops();

        if (!shops || shops.length === 0) {
          spinner.stop();
          console.log(chalk.yellow('No shops found.'));
          return;
        }

        spinner.stop();

        console.log(chalk.cyan.bold('\nYour Shops:\n'));

        for (const shop of shops) {

          console.log(
            chalk.green(`Shop: ${shop.name}`) +
            chalk.gray(` (ID: ${shop.id})`)
          );

          const themes = await api.getThemes(shop.id);

          if (!themes || themes.length === 0) {
            console.log(chalk.gray('  No themes found.'));
            console.log('');
            continue;
          }

          for (const theme of themes) {

            const isDefault = theme.id === 0;
            const isActive =
              theme.applied_shop_names &&
              theme.applied_shop_names.includes(shop.name);

            const marker = isActive ? chalk.blue('● ') : '  ';

            console.log(
              marker +
              (isDefault
                ? chalk.yellow('Default Theme')
                : chalk.white(theme.name)) +
              chalk.gray(` (ID: ${theme.id})`)
            );
          }

          console.log('');
        }

      } catch (error) {
        spinner.stop();
        console.log(chalk.red('❌ Failed to fetch shops.'));
        console.log(error.response?.data?.message || error.message);
      }
    });
}
