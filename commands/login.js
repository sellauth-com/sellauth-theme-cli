import readline from 'readline';
import ora from 'ora';
import chalk from 'chalk';
import SellAuthAPI from '../lib/sellauth-api.js';
import { saveConfig } from '../lib/config.js';

export default function registerLoginCommand(program) {
  program
    .command('login')
    .description('Login with your SellAuth API key')
    .action(async () => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

      const spinner = ora();

      try {
        const input = await ask('Enter your API key: ');
        const apiKey = input.trim();

        if (!apiKey) {
          console.log(chalk.red('❌ API key is required.'));
          rl.close();
          return;
        }

        spinner.start('Verifying API key...');

        const api = new SellAuthAPI({ apiKey });

        const shops = await api.getShops();

        if (!shops || shops.length === 0) {
          spinner.fail('API key valid but no shops found.');
          rl.close();
          return;
        }

        spinner.succeed('API key verified successfully.');

        saveConfig({ apiKey });

        console.log(chalk.green(`Logged in. Found ${shops.length} shop(s).`));
      } catch (error) {
        if (spinner.isSpinning) spinner.stop();

        console.log(
          chalk.red(error.response?.data?.message || 'Invalid API key or connection failed.')
        );
      } finally {
        rl.close();
      }
    });
}
