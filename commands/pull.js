import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';
import resolveShop from '../lib/resolve-shop.js';

export default function registerPullCommand(program, api) {
  program
    .command('pull')
    .description('Download theme files locally')
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

        const shopId = await resolveShop(api, options.shop);

        spinner.text = 'Exporting theme...';

        const zipBuffer = await api.exportTheme(shopId, options.theme);

        const baseDir = path.join(process.cwd(), 'themes', options.theme);

        await fs.ensureDir(baseDir);

        spinner.text = 'Extracting theme...';

        const zip = new AdmZip(zipBuffer);
        zip.extractAllTo(baseDir, true);

        spinner.succeed('Theme downloaded successfully.');

        console.log(chalk.green(`Saved to: ${path.relative(process.cwd(), baseDir)}`));
      } catch (error) {
        spinner.fail(error.response?.data?.message || error.message);
      }
    });
}
