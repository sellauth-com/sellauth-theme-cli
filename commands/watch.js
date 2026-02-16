import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import resolveShop from '../lib/resolve-shop.js';
import { pushSingleFile, deleteSingleFile } from '../lib/sync-single-file.js';
import { injectReloadScript } from '../lib/inject-reload.js';
import { startReloadServer } from '../lib/reload-server.js';
import { startTailwindWatcher } from '../lib/tailwind.js';

export default function registerWatchCommand(program, api) {
  program
    .command('watch')
    .description('Watch local theme and sync changes to SellAuth')
    .requiredOption('--theme <themeId>', 'Theme ID')
    .option('--shop <shopId>', 'Shop ID')
    .option('--dir <directory>', 'Themes directory', 'themes')
    .option('--template <template>', 'Preview template', 'shop')
    .action(async (options) => {
      if (!api) {
        console.log(chalk.red('❌ Not logged in.'));
        console.log('Run: sellauth-theme login');
        return;
      }

      const spinner = ora();

      try {
        /* -----------------------
           Resolve Shop
        ----------------------- */

        spinner.text = 'Resolving shop...';
        spinner.start();

        const shopId = await resolveShop(api, options.shop);

        /* -----------------------
           Generate Builder Token
        ----------------------- */

        spinner.text = 'Generating builder token...';

        let tokenResponse = await api.generateBuilderToken(shopId, options.theme);

        spinner.stop();

        let currentToken = tokenResponse.token;
        let expiresAt = new Date(tokenResponse.expires_at);

        const buildPreviewUrl = () =>
          api.getBuilderPreviewUrl(shopId, options.theme, currentToken, options.template);

        console.log(chalk.green('🚀 Live Preview Ready'));
        console.log(chalk.blue(buildPreviewUrl()));
        console.log('');
        console.log(chalk.gray('Watching for file changes...\n'));

        /* -----------------------
           Token Expiration Monitor
        ----------------------- */

        const tokenInterval = setInterval(async () => {
          const now = new Date();

          if (now >= expiresAt) {
            console.log(chalk.yellow('\n⚠ Builder token expired. Regenerating...'));

            try {
              const newTokenResponse = await api.generateBuilderToken(shopId, options.theme);

              currentToken = newTokenResponse.token;
              expiresAt = new Date(newTokenResponse.expires_at);

              console.log(chalk.green('🔁 New Preview URL:'));
              console.log(chalk.blue(buildPreviewUrl()));
              console.log('');
            } catch (err) {
              console.log(chalk.red('❌ Failed to regenerate builder token.'));
            }
          }
        }, 60 * 1000); // check every minute

        /* -----------------------
           Prepare Theme Path
        ----------------------- */

        const themePath = path.resolve(options.dir, options.theme);

        if (!fs.existsSync(themePath)) {
          console.log(chalk.red(`❌ Local theme folder not found: ${themePath}`));
          return;
        }

        /* -----------------------
           Start Reload Server
        ----------------------- */

        const reloadServer = startReloadServer(3456);

        /* -----------------------
           Inject Reload Script
        ----------------------- */

        if (injectReloadScript(themePath)) {
          const layoutPath = path.join(themePath, 'layouts', 'master.njk');

          if (fs.existsSync(layoutPath)) {
            await pushSingleFile({
              api,
              themeId: options.theme,
              absolutePath: layoutPath,
              themePath,
            });

            console.log(chalk.green('✅ Injected live reload script into master.njk'));
          }
        }

        /* -----------------------
           File Watcher
        ----------------------- */

        const watcher = chokidar.watch(themePath, {
          ignoreInitial: true,
        });

        let reloadTimeout;

        const scheduleReload = () => {
          clearTimeout(reloadTimeout);
          reloadTimeout = setTimeout(() => {
            reloadServer.markChanged();
          }, 200);
        };

        watcher.on('change', async (filePath) => {
          await pushSingleFile({
            api,
            themeId: options.theme,
            absolutePath: filePath,
            themePath,
          });
          scheduleReload();
        });

        watcher.on('add', async (filePath) => {
          await pushSingleFile({
            api,
            themeId: options.theme,
            absolutePath: filePath,
            themePath,
          });
          scheduleReload();
        });

        watcher.on('unlink', async (filePath) => {
          await deleteSingleFile({
            api,
            themeId: options.theme,
            absolutePath: filePath,
            themePath,
          });
          scheduleReload();
        });

        /* -----------------------
           Start Tailwind Watcher
        ----------------------- */
        const tailwindWatcher = startTailwindWatcher(themePath);

        /* -----------------------
           Graceful Shutdown
        ----------------------- */

        process.on('SIGINT', () => {
          console.log('\nStopping watcher...');
          watcher.close();
          reloadServer.close();
          clearInterval(tokenInterval);

          if (tailwindWatcher) {
            tailwindWatcher.close();
          }

          process.exit(0);
        });
      } catch (error) {
        spinner.fail('Watch failed.');
        console.log(chalk.red(error.response?.data?.message || error.message));
      }
    });
}
