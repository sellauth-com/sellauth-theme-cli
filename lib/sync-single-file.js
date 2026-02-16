import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const TEXT_EXTENSIONS = new Set(['njk', 'html', 'css', 'js', 'json', 'txt', 'md', 'xml', 'svg']);

function toRelativePosix(themePath, absolutePath) {
  return path.relative(themePath, absolutePath).replace(/\\/g, '/');
}

// Builder routes only support /{folderName}/{fileName} where fileName cannot include "/"
function parseBuilderPath(relativePath) {
  const parts = relativePath.split('/').filter(Boolean);

  if (parts.length === 1) {
    return { folderName: 'root', fileName: parts[0], ok: true };
  }

  if (parts.length === 2) {
    return { folderName: parts[0], fileName: parts[1], ok: true };
  }

  // Nested paths like assets/img/logo.png can't map to /{folder}/{file}
  return { ok: false, reason: 'Nested paths are not supported by builder routes.' };
}

function isTextFile(fileName) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

export async function pushSingleFile({ api, themeId, absolutePath, themePath }) {
  const relative = toRelativePosix(themePath, absolutePath);
  const parsed = parseBuilderPath(relative);

  if (!parsed.ok) {
    console.log(chalk.yellow(`⚠ Skipped: ${relative} (${parsed.reason})`));
    return { skipped: true, relative };
  }

  const { folderName, fileName } = parsed;

  if (!isTextFile(fileName)) {
    console.log(
      chalk.yellow(`⚠ Skipped binary/non-text file (use upload endpoint later): ${relative}`)
    );
    return { skipped: true, relative };
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');

  await api.updateFile(themeId, folderName, fileName, content);

  console.log(chalk.green(`✔ Updated: ${relative}`));
  return { updated: true, relative };
}

export async function deleteSingleFile({ api, themeId, absolutePath, themePath }) {
  const relative = toRelativePosix(themePath, absolutePath);
  const parsed = parseBuilderPath(relative);

  if (!parsed.ok) {
    console.log(chalk.yellow(`⚠ Skipped delete: ${relative} (${parsed.reason})`));
    return { skipped: true, relative };
  }

  const { folderName, fileName } = parsed;

  await api.deleteFile(themeId, folderName, fileName);

  console.log(chalk.yellow(`🗑 Deleted: ${relative}`));
  return { deleted: true, relative };
}
