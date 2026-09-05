// This file defines the actual HTTP endpoints for Auth: what URL + method
// combinations exist, and how to turn an incoming request into a call to
// service.ts, then turn the result (or error) into an HTTP response.
// No business logic lives here — that's all in service.ts. This file is
// purely "translate HTTP <-> function calls".

import { Router, type Express, type Request, type Response } from 'express';
import * as authService from './service';

// A Router is a mini, self-contained set of routes that gets "mounted" onto
// the main app at a specific path (see registerAuth below).
const router = Router();

// POST /api/v1/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Bare minimum validation for MVP — just check the fields exist.
  // No email format checking or password strength rules yet; that's a
  // deliberate scope decision, not an oversight.
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await authService.signUp(email, password);
    // 201 Created — the correct status code for "a new resource was made".
    res.status(201).json(result);
  } catch (err) {
    // service.ts throws a plain Error with a specific message for expected
    // failure cases. We check for that message here to pick the right HTTP
    // status code — this is the ONLY place that knows about HTTP status codes;
    // service.ts doesn't know or care that it's being called over HTTP at all.
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    // Anything unexpected (e.g. database connection dropped) falls through to
    // a generic 500, and gets logged so we can actually debug it later.
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/v1/auth/signin
router.post('/signin', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await authService.signIn(email, password);
    // Plain 200 OK (json()'s default) — nothing new was created, we're just
    // confirming who you are and handing back a token.
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      // 401 Unauthorized — correct status for "wrong email/password".
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// This is the function index.ts calls to wire Auth into the app — matches the
// `registerAuth(app)` pattern described in architectureDocumentation.md.
// Mounting the router at '/api/v1/auth' means the routes above are actually
// reachable at /api/v1/auth/signup and /api/v1/auth/signin.
export function registerAuth(app: Express) {
  app.use('/api/v1/auth', router);
}