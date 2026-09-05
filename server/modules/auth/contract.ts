// This is Auth's PUBLIC CONTRACT — the only file other modules are allowed to
// import from. Everything else in this folder (service.ts, repository.ts,
// routes.ts) is private to Auth.
//
// Per architectureDocumentation.md, Auth's contract is exactly these two
// functions: getUser(id) and verifyToken(t). Nothing more gets exposed here on
// purpose — if some future module needs something else from Auth, it should be
// added here deliberately, not by reaching into service.ts directly.
export { getUser, verifyToken } from './service';