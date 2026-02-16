import path from 'path';
import fs from 'fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

export async function startTailwindWatcher(themePath) {
  const configPath = path.join(themePath, 'tailwind.config.js');
  const inputPath = path.join(themePath, 'assets', 'style.css');
  const outputPath = path.join(themePath, 'assets', 'built.css');

  if (!fs.existsSync(configPath)) {
    return null;
  }

  if (!fs.existsSync(inputPath)) {
    console.log(chalk.yellow('⚠ Tailwind config found but assets/style.css missing.'));
    return null;
  }

  console.log(chalk.cyan('🌬 Tailwind detected. Watching for changes...'));

  let config;
  let contentGlobs = [];

  try {
    // Try CommonJS first
    const require = createRequire(import.meta.url);
    config = require(configPath);
  } catch (err) {
    try {
      // Fallback to ESM
      const configModule = await import(pathToFileURL(configPath).href);
      config = configModule.default || configModule;
    } catch (err2) {
      console.log(chalk.red('❌ Failed to load tailwind.config.js'));
      console.log(err2.message);
      return null;
    }
  }

  contentGlobs = config.content || [];

  if (!contentGlobs.length) {
    contentGlobs = [
      './templates/**/*.njk',
      './layouts/**/*.njk',
      './components/**/*.njk',
      './snippets/**/*.njk',
    ];
  }

  const resolvedGlobs = contentGlobs.map((glob) => path.join(themePath, glob));

  const build = async () => {
    try {
      const css = fs.readFileSync(inputPath, 'utf8');

      const result = await postcss([tailwindcss(configPath), autoprefixer]).process(css, {
        from: inputPath,
        to: outputPath,
      });

      fs.writeFileSync(outputPath, result.css);

      console.log(chalk.gray('✓ Tailwind rebuilt'));
    } catch (err) {
      console.log(chalk.red('❌ Tailwind build error'));
      console.log(err.message);
    }
  };

  await build();

  const watcher = chokidar.watch([inputPath, configPath, ...resolvedGlobs], {
    ignoreInitial: true,
  });

  watcher.on('change', build);
  watcher.on('add', build);
  watcher.on('unlink', build);

  return watcher;
}
