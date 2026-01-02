import fs from 'node:fs';
import path from 'node:path';
import dotenvFlow from 'dotenv-flow';

if (!globalThis.__ENV_LOADED__) {
  const ENV = process.env.NODE_ENV || 'development';
  const root = process.cwd();

  dotenvFlow.config({
    node_env: ENV,
    default_node_env: 'development',
    silent: true
  });

  const candidatesInLoadOrder = [
    '.env',
    '.env.local',
    `.env.${ENV}`,
    `.env.${ENV}.local`
  ].map(f => path.join(root, f));

  const existing = candidatesInLoadOrder.filter(f => fs.existsSync(f));

  if (existing.length) {
    console.log(
      `[env] NODE_ENV="${ENV}" • loaded files:\n` +
      existing.map(f => `       - ${path.relative(root, f)}`).join('\n')
    );
  } else {
    console.warn(`[env] NODE_ENV="${ENV}" • no .env files found`);
  }

  globalThis.__ENV_LOADED__ = true;
}
