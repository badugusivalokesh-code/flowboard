import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

const COOKIE_NAME = 'pb_token';

/**
 * Requires a valid JWT, read from the httpOnly cookie (preferred) or
 * an Authorization: Bearer header as a fallback. On success, attaches
 * req.userId — every downstream query MUST scope by this, never by
 * anything the client sends in the request body/params.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const cookieToken = req.cookies?.[COOKIE_NAME] as string | undefined;
    const header = req.headers.authorization;
    const headerToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const token = cookieToken || headerToken;

    if (!token) {
      throw ApiError.unauthorized('Missing authentication token');
    }

    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired session'));
  }
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
