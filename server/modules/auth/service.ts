// This is the actual business logic for authentication — the "brain" of the
// Auth module. routes.ts calls into this file; this file calls into repository.ts
// for anything that touches the database. It never talks to Prisma directly.

import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import * as authRepository from './repository';

// The secret key used to sign and verify JWTs. Whoever holds this string can
// forge valid tokens, so it must never be committed to git — it lives in .env
// locally, and as a Render environment variable in production.
const JWT_SECRET = process.env.JWT_SECRET as string;

// How long a token stays valid before the user has to sign in again.
const JWT_EXPIRES_IN = '7d';

// Fail loudly and immediately on startup if the secret is missing, rather than
// silently generating broken/unverifiable tokens later. Better to crash now
// with a clear message than to debug a mysterious auth failure in production.
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

// Handles a new account being created.
// Steps: 1) make sure the email isn't already registered,
//        2) hash the plaintext password (never store it as-is),
//        3) save the new user,
//        4) issue a JWT so the user is immediately logged in after signing up.
export async function signUp(email: string, password: string) {
  const existing = await authRepository.findUserByEmail(email);
  if (existing) {
    // Thrown as a plain Error with a specific message; routes.ts checks this
    // message to decide which HTTP status code to send back (409 Conflict here).
    throw new Error('EMAIL_TAKEN');
  }

  // argon2.hash() automatically generates a random salt and bakes it into the
  // output string, so we don't need to manage salts ourselves.
  const passwordHash = await argon2.hash(password);
  const user = await authRepository.createUser(email, passwordHash);

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // Never return passwordHash to the client, even though we have it in `user`.
  return { token, user: { id: user.id, email: user.email } };
}

// Handles an existing user logging in.
// Steps: 1) find the account by email,
//        2) check the given password against the stored hash,
//        3) issue a fresh JWT if it matches.
export async function signIn(email: string, password: string) {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    // Deliberately the SAME error for "no such email" and "wrong password" below —
    // returning a different message for each would let an attacker figure out
    // which emails are registered just by trying to sign in.
    throw new Error('INVALID_CREDENTIALS');
  }

  // argon2.verify() re-hashes the given password using the same salt/params
  // stored inside `user.passwordHash`, then compares the results.
  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return { token, user: { id: user.id, email: user.email } };
}

// Checks that a token is genuinely one we issued (correct signature) and hasn't
// expired. Throws automatically if either check fails — jwt.verify() does this
// for us, we don't need to check anything manually.
// This is one of the two functions exposed in contract.ts — it's how
// auth-middleware.ts (and eventually other modules) confirm "this request is
// really from a logged-in user" without needing to know anything about how
// tokens work internally.
export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}

// Looks up basic public info about a user by id. This is the other function
// exposed in contract.ts — e.g. Activities could eventually call this to
// confirm a userId is real before attaching an activity to it, without ever
// running its own query against auth.users.
export async function getUser(id: string) {
  const user = await authRepository.findUserById(id);
  if (!user) return null;
  return { id: user.id, email: user.email };
}