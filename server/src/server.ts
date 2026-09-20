import dotenv from 'dotenv';
import { createApp } from './app';
import { connectDB, disconnectDB } from './config/db';
import { assertRequiredEnvVars } from './config/env';

// TEMPORARY DIAGNOSTIC LOGGING — safe to remove once the DNS workaround is
// confirmed working. Capturing dotenv's own result (instead of the usual
// `import 'dotenv/config'` side-effect form) lets us prove whether it found
// server/.env at all, and which KEYS it parsed — never logging any values,
// so no credentials/URIs/secrets are ever printed.
const dotenvResult = dotenv.config();
console.log(
  `[startup][dns-diagnostic] dotenv loaded file: ${dotenvResult.error ? 'NO (' + dotenvResult.error.message + ')' : 'yes'}` +
    (dotenvResult.parsed ? `, keys found: ${Object.keys(dotenvResult.parsed).join(', ')}` : '')
);

const PORT = Number(process.env.PORT) || 5000;

async function main() {
  try {
    assertRequiredEnvVars();
  } catch (err) {
    console.error('[startup]', (err as Error).message);
    process.exit(1);
  }

  try {
    await connectDB();
  } catch (err) {
    console.error('[startup] failed to connect to MongoDB:', (err as Error).message);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`[server] listening on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[server] received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main();
