# AthleteOS Glossary

**MVP** - Minimum Viable Product: The smallest version of the app that actually works end to end before adding every feature. 

**ERD** - Entity Relationship Diagram: Shows how entities connect together with their individual attributes

**/Client** - Folder which holds the React app

**/Server** - Folder which holds the Node.js app

**Type** - Text column for activity types e.g run, swim, gym, bike, etc so the app knows which kind of activity a given row is

**jsonb** - a way to store flexible bundles of data in one database column, instead of a seprate table for every sport e.g {distance: 8, pace: 4.5}

**ESLint** - reads code and flags style issues or likely bugs etc

**Docker** Runs a piece of software (e.g postgres) in an isolated box on your machine so there isnt a need to install and configure it by hand. 

**Postgres** - PostgreSQL: Database mManagement System 

**Public Contract** - The small set of functions a module exposes for other modules to cal (e.g getUser (id)) Everything else inside the module is private and off limits to everyone else

**Boundary** - The rule that a module may only import another modules public contract, never its private files or it's database tables directly.

**Event Bus / In Process Events** - A way for one module to react to something happening in another (e.g Goals reacting when an activity is logged) without calling it directly. 

**Schema Per Module** - Each module gets its own named area inside the single postgres database. (e.g activity.sessions, nutrition.entries) therefore tables from different modules can't collide

**Soft Delete** - Marking a record as inactive/deactivated instead of removing it from the database



