import jwt, { type SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  sub: string; // user id
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in the environment');
  }
  return secret;
}

export function signToken(userId: string): string {
  // SignOptions.expiresIn is typed as `number | StringValue`, where
  // StringValue (from the `ms` package, which jsonwebtoken uses internally)
  // is a template-literal type like "7d" | "1h" | ... — not `string`.
  // JWT_EXPIRES_IN comes from an env var, so it's a plain `string` at the
  // type level; TypeScript can't statically prove an arbitrary string
  // matches that narrow pattern even though the runtime value (e.g. the
  // documented "7d" default, or whatever a developer sets) is a valid
  // jsonwebtoken duration format. This is a known friction point with
  // @types/jsonwebtoken ^9.0.6 — the fix is a narrow assertion to the
  // exact type jsonwebtoken itself expects, not `any`, so every other
  // argument in the call below still gets full type checking.
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  return jwt.sign({ sub: userId } as JwtPayload, getSecret(), { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}
