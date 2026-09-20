import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { registerUser, loginUser, getUserById } from '../services/authService';
import { AUTH_COOKIE_NAME } from '../middleware/auth';

function setAuthCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd, // must be true in production (HTTPS); false locally over http
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body ?? {};
  const { user, token } = await registerUser({ name, email, password });
  setAuthCookie(res, token);
  res.status(201).json({ user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  const { user, token } = await loginUser({ email, password });
  setAuthCookie(res, token);
  res.status(200).json({ user });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
  res.status(200).json({ message: 'Logged out' });
});

// GET /api/auth/me — lets the frontend rehydrate session state on refresh.
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(req.userId as string);
  res.status(200).json({ user });
});
