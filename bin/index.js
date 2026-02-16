#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { getConfig } from '../lib/config.js';
import SellAuthAPI from '../lib/sellauth-api.js';

import registerLoginCommand from '../commands/login.js';
import registerCreateCommand from '../commands/create.js';
import registerPullCommand from '../commands/pull.js';
import registerPushCommand from '../commands/push.js';
import registerWatchCommand from '../commands/watch.js';
import registerApplyCommand from '../commands/apply.js';
import registerListIdsCommand from '../commands/listIds.js';

dotenv.config({ quiet: true });

const program = new Command();

program.name('sellauth-theme').description('SellAuth Theme CLI').version('0.1.1');

program
  .command('help')
  .description('Display help information')
  .action(() => {
    program.outputHelp();
  });

async function bootstrap() {
  const config = getConfig();

  let api = null;

  if (config?.apiKey) {
    api = new SellAuthAPI({
      apiKey: config.apiKey,
    });
  } else {
    console.warn('⚠️  Not logged in. Some commands may not work.');
    console.warn('Run: sellauth-theme login');
  }

  registerLoginCommand(program, api);
  registerCreateCommand(program, api);
  registerPullCommand(program, api);
  registerPushCommand(program, api);
  registerWatchCommand(program, api);
  registerApplyCommand(program, api);
  registerListIdsCommand(program, api);

  program.parse(process.argv);
}

bootstrap();
