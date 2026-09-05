// This is the shared "check the token once" middleware described in
// architectureDocumentation.md — instead of every module re-implementing its
// own "is this user logged in" check, protected routes in ANY module can use
// this one function.
//
// It lives in /platform (not inside the auth module folder) because it's
// infrastructure every module shares, not Auth-specific business logic —
// though it DOES import Auth's public contract to do its job, which is exactly
// the kind of cross-module call the architecture allows (contract-only, never
// reaching into auth/service.ts or auth/repository.ts directly).

import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../modules/auth/contract';

// Express's built-in Request type doesn't know about `userId` — we extend it
// here so that any route using this middleware can read `req.userId` with
// full TypeScript support, instead of it being `any`.
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// This is Express middleware: a function that runs BEFORE the actual route
// handler. If it calls next(), Express continues on to the real route. If it
// sends a response instead (res.status(...).json(...)), Express stops there
// and the real route handler never runs.
//
// Usage (in a future module, once we build protected routes):
//   router.post('/', requireAuth, (req, res) => { ... })
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Expected format: "Authorization: Bearer <token>"
  // "Bearer" is just the standard label for "here's a token, treat whoever
  // holds it as authenticated" — it's a convention, not something we invented.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  // Strip the "Bearer " prefix to get just the raw token string.
  const token = authHeader.slice('Bearer '.length);

  try {
    // verifyToken (from Auth's contract) throws if the token is invalid,
    // tampered with, or expired — we don't need to check those cases separately.
    const payload = verifyToken(token);
    // Attach the userId to the request so the actual route handler can use it
    // (e.g. "create this activity for req.userId") without re-verifying anything.
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}