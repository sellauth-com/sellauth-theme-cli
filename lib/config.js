import os from 'os';
import path from 'path';
import fs from 'fs-extra';

const configPath = path.join(os.homedir(), '.sellauth', 'config.json');

export function saveConfig(data) {
  fs.ensureDirSync(path.dirname(configPath));
  fs.writeJsonSync(configPath, data);
}

export function getConfig() {
  if (!fs.existsSync(configPath)) {
    return null;
  }
  return fs.readJsonSync(configPath);
}
