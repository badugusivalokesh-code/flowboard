import 'express';

// Augments Express's Request with the authenticated user's id,
// set by the `requireAuth` middleware after verifying the JWT.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
