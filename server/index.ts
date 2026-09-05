// This is the application's entry point — the "host" described in
// architectureDocumentation.md. Its only job is to create the Express app,
// load config, and call each module's register function. It should stay thin
// forever — actual logic belongs inside modules, never here.

// Loads variables from .env into process.env. MUST be the very first import —
// everything below this line (including files imported by registerAuth) may
// read process.env, so the values need to already be loaded before anything
// else runs. This line does nothing on Render, since there's no .env file
// there — Render injects environment variables directly instead.
import 'dotenv/config';

import express from 'express';
import { registerAuth } from './modules/auth/routes';

const app = express();

// Render (and most hosts) assign a port dynamically via this environment
// variable. 3000 is just the fallback used for local development.
const PORT = process.env.PORT || 3000;

// Built-in Express middleware that parses incoming JSON request bodies into
// req.body. Without this, req.body would be undefined and signup/signin
// couldn't read the email/password sent in the request.
app.use(express.json());

// A minimal endpoint used to confirm the server is alive and reachable —
// doesn't touch the database or do anything meaningful, it's purely a
// "yes, this is running" check, used by both us manually and (eventually)
// by hosting platforms that ping this to know when the app is ready.
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mounts all of Auth's routes (signup, signin) onto the app.
// Matches the registerX(app) pattern from architectureDocumentation.md —
// each future module gets exactly one line here, e.g. registerActivities(app).
registerAuth(app);

// Further module registration (registerActivities, etc.) goes here in later Phase 2 steps

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});