import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import resolveShop from '../lib/resolve-shop.js';
import { syncTheme } from '../lib/sync-theme.js';

export default function registerPushCommand(program, api) {
  program
    .command('push')
    .description('Sync local theme to SellAuth')
    .requiredOption('--theme <themeId>', 'Theme ID')
    .option('--shop <shopId>', 'Shop ID (optional if only one shop exists)')
    .action(async (options) => {
      const spinner = ora();

      try {
        if (!api) {
          console.log(chalk.red('❌ Not logged in.'));
          console.log('Run: sellauth-theme login');
          return;
        }

        spinner.start('Resolving shop...');
        await resolveShop(api, options.shop);

        const themePath = path.join(process.cwd(), 'themes', options.theme);

        if (!(await fs.pathExists(themePath))) {
          throw new Error(`Local theme folder not found: ${themePath}`);
        }

        spinner.text = 'Syncing theme...';

        const result = await syncTheme({
          api,
          themeId: options.theme,
          localPath: themePath,
          onProgress: (type, file) => {
            spinner.text = type === 'upload' ? `Uploading ${file}` : `Deleting ${file}`;
          },
        });

        spinner.succeed(`Sync complete. Uploaded: ${result.uploaded}, Deleted: ${result.deleted}`);
      } catch (error) {
        spinner.fail(error.response?.data?.message || error.message);
      }
    });
}
