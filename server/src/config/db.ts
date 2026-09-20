import mongoose from 'mongoose';
import dns from 'node:dns';

/**
 * Dev-only workaround for a known Node.js + Windows issue: on some Windows
 * networks, Node's own DNS resolver (which does its own UDP SRV lookups,
 * independent of whatever `nslookup`/the OS resolver does) fails to resolve
 * MongoDB Atlas's `_mongodb._tcp.<cluster>` SRV record with
 * `querySrv ECONNREFUSED`, even though `nslookup` for the same record
 * succeeds. Pointing Node's resolver at a public DNS server (Google's, in
 * this case) works around it — confirmed manually via
 * `dns.setServers(['8.8.8.8']); dns.promises.resolveSrv(...)`.
 *
 * This does NOT touch Windows' DNS settings, the OS resolver, the Atlas
 * cluster, or the connection string (still a normal `mongodb+srv://` URI) —
 * it only repoints Node's *own* internal resolver, and only for this one
 * process. It never runs unless BOTH conditions hold:
 *   1. NODE_ENV !== 'production' (hard-gated — see below)
 *   2. MONGO_SRV_DNS_WORKAROUND=true is explicitly set (opt-in, not a
 *      default-on behavior change for developers who aren't hitting this)
 *
 * Note the scope: `dns.setServers()` is process-global in Node — it affects
 * all DNS lookups this server process makes, not just MongoDB's. That's a
 * non-issue for FlowBoard today (no other outbound DNS-dependent calls
 * exist), but worth knowing if that ever changes.
 */
function applyDevDnsWorkaroundIfEnabled(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const rawFlag = process.env.MONGO_SRV_DNS_WORKAROUND;
  const optedIn = rawFlag === 'true';

  // TEMPORARY DIAGNOSTIC LOGGING — safe to remove once the workaround is
  // confirmed working. Logs only NODE_ENV and this one boolean-ish flag's
  // raw value (never MONGO_URI/JWT_SECRET/credentials) so we can see
  // exactly why the workaround does or doesn't activate on a given machine.
  console.log(
    `[mongo][dns-diagnostic] NODE_ENV=${JSON.stringify(process.env.NODE_ENV)} ` +
      `MONGO_SRV_DNS_WORKAROUND=${JSON.stringify(rawFlag)} ` +
      `isProd=${isProd} optedIn=${optedIn}`
  );

  if (isProd || !optedIn) {
    console.log('[mongo][dns-diagnostic] workaround NOT applied — see flags above for why');
    return;
  }

  dns.setServers(['8.8.8.8', '8.8.4.4']);
  // Read the servers back from the dns module itself, rather than just
  // trusting that setServers() didn't throw — this proves the change
  // actually took effect inside Node's resolver, not just that the line
  // of code ran.
  console.log('[mongo][dns-diagnostic] dns.getServers() after setServers():', dns.getServers());
  console.warn(
    '[mongo] MONGO_SRV_DNS_WORKAROUND=true — using public DNS (8.8.8.8/8.8.4.4) ' +
      'to resolve the Atlas SRV record. Development only; see README.'
  );
}

/**
 * Connects to MongoDB using MONGO_URI.
 * Throws on failure so the caller (server.ts) can decide how to respond
 * (log + exit) rather than starting an API that can't reach its database.
 */
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in the environment');
  }

  applyDevDnsWorkaroundIfEnabled();

  mongoose.set('strictQuery', true);

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err.message);
  });

  await mongoose.connect(uri);
  console.log(`[mongo] connected -> ${mongoose.connection.name}`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
  console.log('[mongo] connection closed');
}
