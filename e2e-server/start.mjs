// Starts everything the tests need, in one process that Playwright's `webServer` manages:
//   1. the mock AI server (stands in for OpenRouter)
//   2. a fresh i-HR test database (migrate:fresh --seed)
//   3. i-HR itself on PHP's built-in server
// i-HR's own code is not modified; it is configured for testing through environment variables.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

try {
  process.loadEnvFile?.();
} catch {
  /* .env is optional */
}

const appDir = resolve(process.env.IHR_APP_DIR ?? '../ihr');
const port = Number(process.env.IHR_PORT ?? 8090);
const aiPort = Number(process.env.MOCK_AI_PORT ?? 4010);

if (!existsSync(resolve(appDir, 'artisan'))) {
  console.error(`i-HR not found at ${appDir}. Set IHR_APP_DIR to the i-HR checkout (see README).`);
  process.exit(1);
}

/** Test configuration for i-HR. These override its .env (process variables win in Laravel). */
const env = {
  ...process.env,
  APP_ENV: 'local', // seeds the demo HR account and vacancy
  APP_DEBUG: 'false',
  APP_URL: `http://127.0.0.1:${port}`,
  DB_CONNECTION: 'pgsql',
  DB_DATABASE: process.env.IHR_DB_DATABASE ?? 'ihr_e2e',
  DB_URL: '',
  DATABASE_URL: '',
  SESSION_DRIVER: 'database',
  SESSION_SECURE_COOKIE: 'false',
  SESSION_DOMAIN: '',
  CACHE_STORE: 'database',
  QUEUE_CONNECTION: 'sync', // résumés are parsed during the upload request
  MAIL_MAILER: 'log',
  UPLOADS_DISK: 'local',
  AI_API_KEY: 'e2e-mock-key',
  AI_BASE_URL: `http://127.0.0.1:${aiPort}/v1`,
  AI_MODEL: 'mock',
  // Each test browser sends its own X-Real-IP: tests get separate rate-limit buckets,
  // and a test can pretend to be outside the office network.
  CLIENT_IP_HEADER: 'X-Real-IP',
  IP_ALLOWLIST: '127.0.0.0/8',
  IP_ALLOWLIST_SCOPE: 'hr',
  // The seeded HR account the tests sign in with (src/data/accounts.ts reads the same values)
  HR_ADMIN_USERNAME: process.env.E2E_HR_USERNAME ?? 'humanres',
  HR_ADMIN_EMAIL: 'hr@e2e.test',
  HR_ADMIN_PASSWORD: process.env.E2E_HR_PASSWORD ?? 'E2e-Hr-Password-2026',
  PHP_CLI_SERVER_WORKERS: process.env.PHP_CLI_SERVER_WORKERS ?? '6',
};

const children = [];
const stop = () => children.forEach((c) => c.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', stop);

children.push(spawn(process.execPath, ['e2e-server/mock-ai.mjs'], { stdio: 'inherit', env }));

console.log(`Resetting the i-HR test database "${env.DB_DATABASE}"…`);
execFileSync('php', ['artisan', 'migrate:fresh', '--seed', '--force', '--no-interaction'], {
  cwd: appDir,
  env,
  stdio: 'inherit',
});
execFileSync('php', ['artisan', 'optimize:clear', '--no-interaction'], { cwd: appDir, env, stdio: 'ignore' });

// Laravel's router script serves from the current directory, so run inside public/
const router = resolve(appDir, 'vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php');
const server = spawn('php', ['-S', `127.0.0.1:${port}`, router], {
  cwd: resolve(appDir, 'public'),
  env,
  stdio: ['ignore', 'ignore', 'inherit'],
});
children.push(server);
server.on('exit', (code) => process.exit(code ?? 1));
console.log(`i-HR running at http://127.0.0.1:${port}`);
