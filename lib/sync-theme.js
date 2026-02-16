import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function buildLocalFileMap(themePath) {
  const fileMap = {};

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const relativePath = path.relative(themePath, fullPath).replace(/\\/g, '/');

        const content = await fs.readFile(fullPath);
        fileMap[relativePath] = hashContent(content);
      }
    }
  }

  await walk(themePath);

  return fileMap;
}

async function buildRemoteFileMap(api, themeId) {
  const response = await api.getFiles(themeId);

  if (!response.success) {
    throw new Error('Failed to fetch remote files.');
  }

  const fileMap = {};

  for (const folder of response.folders) {
    for (const file of folder.files) {
      // Backend now gives full relative path
      fileMap[file.relativePath] = file.hash;
    }
  }

  return fileMap;
}

export async function syncTheme({ api, themeId, localPath, onProgress }) {
  const localFiles = await buildLocalFileMap(localPath);
  const remoteFiles = await buildRemoteFileMap(api, themeId);

  const uploads = [];
  const deletes = [];

  // New or changed
  for (const file in localFiles) {
    if (!remoteFiles[file] || remoteFiles[file] !== localFiles[file]) {
      uploads.push(file);
    }
  }

  // Deleted locally
  for (const file in remoteFiles) {
    if (!localFiles[file]) {
      deletes.push(file);
    }
  }

  // Upload changed/new
  for (const file of uploads) {
    const fullPath = path.join(localPath, file);
    const folder = path.dirname(file);
    const fileName = path.basename(file);

    const content = await fs.readFile(fullPath, 'utf-8');

    const folderName = folder === '.' ? 'root' : folder;

    await api.updateFile(themeId, folderName, fileName, content);

    if (onProgress) onProgress('upload', file);
  }

  // Delete removed
  for (const file of deletes) {
    const folder = path.dirname(file);
    const fileName = path.basename(file);

    const folderName = folder === '.' ? 'root' : folder;

    await api.deleteFile(themeId, folderName, fileName);

    if (onProgress) onProgress('delete', file);
  }

  return {
    uploaded: uploads.length,
    deleted: deletes.length,
  };
}
