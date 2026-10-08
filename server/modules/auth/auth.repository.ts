// This file is the ONLY place allowed to touch the `auth.users` table directly.
// Per the architecture doc's "schema per module" rule, nothing outside this file
// should ever run a Prisma query against `User` — everything else goes through
// service.ts, which calls the functions defined here.

import { prisma } from '../../platform/prisma';

// Inserts a new row into auth.users.
// Takes an email and an ALREADY-HASHED password (hashing happens in service.ts,
// never here — this file just stores whatever it's given).
export async function createUser(email: string, passwordHash: string) {
  return prisma.user.create({
    data: { email, passwordHash },
  });
}

// Looks up a user by email. Used during sign-in (to find the account to check
// the password against) and during sign-up (to check the email isn't already taken).
// Returns `null` if no user has that email — Prisma's findUnique does this automatically,
// it doesn't throw an error for "not found".
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

// Looks up a user by their id. This is what powers the `getUser(id)` function in
// the public contract — other modules will eventually call this indirectly to
// check "does this user still exist" without ever querying auth.users themselves.
export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}