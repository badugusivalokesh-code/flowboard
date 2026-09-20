const REQUIRED_VARS = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'] as const;

/**
 * Fails fast and loudly if a required env var is missing, instead of
 * letting each piece of code discover the gap on its own later — most
 * dangerously, `cors({ origin: process.env.CLIENT_URL })` silently falls
 * back to a permissive default if CLIENT_URL is undefined, which would
 * quietly defeat the "never wildcard with credentials" requirement.
 */
export function assertRequiredEnvVars(): void {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy server/.env.example to server/.env and fill these in before starting the server.'
    );
  }
}
