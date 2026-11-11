# Banana Quiz

<p align="left">
  <img src="./client/src/assets/banana-logo.jpg" alt="Banana Quiz logo" width="180">
</p>

Banana Quiz is a browser-based banana-value calculation game. Each round
loads a puzzle from the Banana API; the player studies the image, calculates
the value represented by the bananas, and submits a numeric answer before the
timer expires. Correct answers award points, speed bonuses, streak
multipliers, achievements, and leaderboard progress.

The project is a distributed full-stack application:

- **React 19 and Vite** provide the responsive browser client.
- **Express 5** provides the REST API and security middleware.
- **MongoDB and Mongoose** store users, sessions, game history, scores, and
  login events.
- **Passport** supports Google and Facebook sign-in.
- **Nodemailer** sends email-verification codes, password-reset links, and
  security notifications when SMTP is configured.
- The external **Banana API** supplies the calculation puzzles.

## Features

- Banana-value calculation puzzles with server-side answer validation.
- Standard Easy, Standard Hard, and Custom game configurations.
- Countdown timers, answer feedback, skip, timeout, and quit handling.
- Base points, speed bonuses, streak multipliers, and mode scoring.
- Persistent scores, game history, achievements, and public leaderboard.
- Email/password registration with a 6-digit email OTP before the account is
  created, plus resend cooldowns and attempt limits.
- Google and Facebook OAuth login, with provider emails treated as verified.
- Password strength policy, reset links, and session revocation.
- Profile tabs for identity, appearance, notifications, security, activity,
  privacy, and account deactivation.
- Email-verification confirmation for existing accounts created before OTP.
- Login history with device summaries, masked IP addresses, and failed-attempt
  information.
- Responsive layouts for desktop and mobile browsers.

## Project structure

```text
Banana-Quiz-Game/
├── client/                 # React/Vite browser application
│   ├── public/             # Static browser assets
│   └── src/
│       ├── api/            # Axios API contracts
│       ├── audio/          # Web Audio engine
│       ├── components/     # Shared UI components
│       ├── context/        # Authentication and shared state
│       ├── hooks/          # Reusable React hooks
│       ├── lib/            # Formatting, modes, and UI helpers
│       └── pages/          # Application screens
├── server/                 # Express/MongoDB backend
│   └── src/
│       ├── config/         # Environment and game configuration
│       ├── middleware/     # Authentication and error handling
│       ├── models/         # Mongoose schemas
│       ├── routes/         # HTTP endpoints
│       ├── services/       # Game, mail, verification, API, and history logic
│       └── utils/          # Shared validation, serializers, and logging helpers
├── docs/                   # Architecture and assignment evidence
├── ASSIGNMENT_BRIEF.md
└── README.md
```

Generated folders such as `client/node_modules`, `server/node_modules`, and
`client/dist` are not part of the source tree.

## Requirements

- Node.js with npm.
- A MongoDB database, local or hosted.
- A configured `server/.env` file.
- Optional Google/Facebook application credentials for OAuth.
- SMTP credentials for OTP and notification email. Email/password sign-up
  cannot be completed in production without a working mail provider.

## Installation and local development

Install dependencies in both applications:

```bash
cd server
npm install

Create a `server/.env` file based on `server/.env.example` before starting the server.

## Available Server Commands
=======
cd ../client
npm install
```

```bash
copy server\.env.example server\.env
```

Set at least `MONGODB_URI` and a strong `SESSION_SECRET` in
`server/.env`. Then run the applications in separate terminals:

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```

The client normally runs at `http://localhost:5173` and the API at
`http://localhost:3000`. Vite proxies `/auth` and `/api` requests to the
server. Use `npm start` in `server/` for a non-watch server process.

## Environment configuration

The complete template is in [server/.env.example](./server/.env.example).
Important settings include:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Development or production behavior |
| `PORT` | Express listening port |
| `MONGODB_URI` | MongoDB connection string |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `CLIENT_URL` | Browser URL used for CORS and redirects |
| `AUTH_CALLBACK_URL` | Server URL used for OAuth callbacks |
| `COOKIE_SECURE` | Enables secure cookies when using HTTPS |
| `GOOGLE_*`, `FACEBOOK_*` | OAuth application credentials |
| `PASSWORD_RESET_TTL_MINUTES` | Password-reset link lifetime |
| `EMAIL_OTP_TTL_MINUTES` | Minutes an email verification code stays valid |
| `EMAIL_OTP_MAX_ATTEMPTS` | Wrong OTP attempts allowed before the code locks |
| `EMAIL_OTP_MAX_RESENDS` | Maximum resend requests per challenge |
| `EMAIL_OTP_RESEND_SECONDS` | Cooldown between resend requests |
| `SMTP_*`, `MAIL_FROM` | SMTP host, credentials, and sender address |
| `GAME_*` | Scoring and game timing configuration |
| `BANANA_API_*` | External question timeout and retry settings |

Never commit `.env` files, OAuth secrets, SMTP passwords, or database
credentials.

## Browser routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page with features, modes, achievements, FAQ and a live leaderboard preview |
| `/login` | Public | Sign in, create an account, or continue with Google/Facebook |
| `/forgot-password` | Public | Request a single-use password reset link |
| `/reset-password?token=…` | Public | Choose a new password from a valid reset link |
| `/dashboard` | Signed in | Post-login hub: player status, mode picker, audio controls, achievements preview |
| `/play?mode=classic\|blitz\|zen` | Signed in | The counting game |
| `/achievements` | Signed in | Full achievement cabinet with progress filters |
| `/leaderboard` | Public | Global rankings |
| `/profile` | Signed in | Account details, preferences, password, devices and login history |

A successful sign-in redirects to `/dashboard`.

## Player accounts

Players can sign up and sign in in two ways:

- **Email + password** on `/login` (the Create Account tab). Passwords are hashed
  with bcrypt and never returned by the API. Single-word names are supported;
  first and last name are optional profile fields.
- **Google / Facebook OAuth** using the buttons on the same page.

### Auth endpoints

- `POST /auth/register` with `{ "name", "email", "password" }` — creates the
  account and starts a session. The password must pass the shared password policy.
- `POST /auth/login` with `{ "email", "password" }` — starts a session. Successful
  and failed attempts are both recorded in the player's login history.
- `POST /auth/forgot-password` with `{ "email" }` — creates a single-use reset
  token and emails a link when the account exists. The response is always the
  same so the endpoint cannot be used to discover registered emails.
- `GET /auth/reset-password/validate?token=…` — checks a reset token before the
  page asks for a new password.
- `POST /auth/reset-password` with `{ "token", "password" }` — sets the new
  password, marks the token used and signs out every existing session.
- `POST /auth/logout` — ends the session.
- `GET /auth/status` — returns `{ authenticated, user }` for the current session.
- `GET /auth/google` / `GET /auth/facebook` — begin the OAuth flow.

If an email is already linked to a social account, password login returns a
message telling the player to use Google or Facebook instead.

### Password policy

Registration, password changes and password resets all use
`server/src/utils/passwordPolicy.js`:

- At least 8 characters (12+ is marked as strong).
- At least three of lowercase letters, uppercase letters, numbers and symbols.
- Not a well-known common password.
- Does not contain the player's name or email address.

The client mirrors these rules in `client/src/lib/passwordStrength.js`, so the
sign-up, reset and account-settings forms show a live strength meter and
checklist while the player types. The server remains authoritative.

### Password reset links

Reset links contain a 32-byte random token. Only a SHA-256 hash of the token is
stored, alongside a 30-minute expiry (`PASSWORD_RESET_TTL_MINUTES`). Tokens are
single-use, and requesting a new link invalidates any previous unused link.
Expired token documents are removed by MongoDB's TTL monitor.

When SMTP is not configured, the server logs the reset URL and, in development
only, returns it as `devResetUrl` so the flow can be tested locally. In
production, the link is never returned by the API.

Configure email delivery with the optional SMTP variables in
`server/.env.example`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`,
`SMTP_PASS` and `MAIL_FROM`.

### Account endpoints

All account endpoints require an authenticated session.

- `GET /api/users/me` — profile plus current stats.
- `PATCH /api/users/me` — update `name`, `bio` (max 160 chars), `avatar` (http(s)
  URL), `favoriteMode` (`classic`, `blitz`, `zen`) and `preferences`
  (`reducedMotion`, `showOnLeaderboard`).
- `PATCH /api/users/me/password` — set or change the password. Existing passwords
  require `currentPassword`; social-only accounts can add one. The new password
  must pass the policy, and reusing the current password is rejected.
- `GET /api/users/me/security` — security score, checklist, password age, recent
  device count, failed attempts and last sign-in times.
- `POST /api/users/me/logout-others` — sign out every other device while keeping
  the current session.
- `GET /api/users/me/logins` — recent sign-in attempts and grouped devices,
  including the email used, success/failure, failure reason, browser, OS, masked
  IP and whether the attempt came from the current device.
- `GET /api/users/me/achievements` — achievement list, progress and summary.
- `GET /api/users/leaderboard?limit=25` — public rankings. Players who turn off
  `showOnLeaderboard` are excluded.

Login history is stored in a separate `LoginEvent` collection. Each event keeps
the email used, the sign-in method, whether the attempt succeeded and why it
failed, a parsed browser/OS label, a coarse device type and a SHA-256 hash of the
session id (never the raw cookie). The last 50 events per player are kept.
Failed attempts for unknown emails are stored without a player reference.

### Session security

Sessions carry the account's `authVersion`. Changing the password, resetting it
or choosing “Sign out other devices” increments that version, so any session with
an older value is rejected on its next request. A password change keeps the
current session signed in; a reset signs out every device. Password changes and
resets also send a notification email when SMTP is configured.

The API disables `x-powered-by`, uses Helmet security headers, masks IP addresses
in account history, rate-limits credential and password-reset endpoints, and
returns a generic response for forgot-password requests to prevent account
enumeration.

## Game modes

Modes are defined in `server/src/config/gameModes.js` and exposed publicly via
`GET /api/game/modes`.

| Mode | Time per puzzle | Points multiplier | Speed bonus |
| --- | --- | --- | --- |
| Classic | 120 s | 1× | Yes |
| Blitz | 30 s | 1.5× | Yes |
| Zen | 300 s | 1× | No |

### Game endpoints
=======
| `/` | Public | Product landing page, features, modes, FAQ, and leaderboard preview |
| `/login` | Public | Sign in, or create an account through email OTP verification |
| `/verify-email?verificationId=...&purpose=...` | Public | Enter a 6-digit code to finish sign-up or confirm an email |
| `/forgot-password` | Public | Request a reset link |
| `/reset-password?token=...` | Public | Set a new password from a valid token |
| `/dashboard` | Signed in | Player status, game entry, audio, and achievements preview |
| `/play` | Signed in | Choose Standard Easy, Standard Hard, or Custom |
| `/play/game` | Signed in | Solve banana-value puzzles |
| `/game-overview/:gameId` | Signed in | Review a completed or abandoned game |
| `/history` | Signed in | Browse game and puzzle history |
| `/history/:sessionId` | Signed in | View a specific puzzle result |
| `/achievements` | Signed in | Review achievement progress |
| `/leaderboard` | Public | View eligible global rankings |
| `/profile` | Signed in | Manage identity, email verification, preferences, password, devices, privacy, and account status |

Protected routes are wrapped by `ProtectedRoute`. Authentication state is
restored by `AuthProvider` through `/auth/status` when the client starts.

## Game modes and gameplay

The current player-facing modes are defined in
`server/src/config/gameModes.js` and mirrored in
`client/src/lib/format.js`.

| Mode | Configuration | Best for |
| --- | --- | --- |
| Standard Easy | 10 puzzles, 30 seconds per puzzle | Learning the calculation flow |
| Standard Hard | 10 puzzles, 15 seconds per puzzle | Fast calculations |
| Custom | 1-30 puzzles, 10-60 seconds per puzzle | Personal practice |


The game lifecycle is:

1. The player selects a mode and the client creates a game ID.
2. The server requests a puzzle from the Banana API and stores the solution
   privately in a `GameSession`.
3. The server returns the image and timer metadata, but never the solution.
4. The player submits a numeric answer, skips, or reaches the timeout.
5. The server atomically claims the session so a late or duplicate submission
   cannot score the same puzzle twice.
6. The result reveals the solution, updates statistics, and records history.
7. After the configured number of puzzles, the game overview displays the
   final result.

## Scoring and progress

For a correct answer, the server calculates:

```text
(base points + speed bonus) x streak multiplier x mode multiplier
```

The defaults are 100 base points, up to 50 speed-bonus points, a streak step
of 0.1 capped at 2x, and a configurable fast-answer threshold. Incorrect,
skipped, and timed-out puzzles award zero points but remain part of the
player's history and game statistics. Leaderboard eligibility can be disabled
for custom practice games.

Achievements are derived from stored statistics and cover first games, wins,
streaks, fast calculations, point milestones, games played, and mode
completion. The player can inspect progress on `/achievements`.

## Authentication and account security

### Authentication endpoints

- `POST /auth/register` validates the sign-up form and starts an email OTP
  challenge; it does **not** create a `User` yet.
- `POST /auth/register/verify` checks the 6-digit code, creates the verified
  account, starts a session, and returns the signed-in user.
- `POST /auth/register/resend` rotates the code for a pending sign-up, subject
  to the resend cooldown and limit.
- `GET /auth/verification/status?verificationId=...&kind=...` returns the
  masked email, expiry, attempt count, and resend state for a challenge.
- `POST /auth/login` authenticates with email and password.
- `GET /auth/google` and `GET /auth/facebook` start OAuth flows.
- `POST /auth/logout` ends the current session.
- `GET /auth/status` returns the current authentication state.
- `POST /auth/email/verify/request` sends a code to the signed-in account.
- `POST /auth/email/verify/confirm` confirms the signed-in account's email.
- `POST /auth/email/verify/resend` replaces the code for that account.
- `POST /auth/forgot-password` requests a reset link.
- `GET /auth/reset-password/validate?token=...` validates a reset token.
- `POST /auth/reset-password` consumes a valid token and revokes sessions.

Email/password sign-up is a two-step flow. The server hashes the pending
password with bcrypt, stores only SHA-256 hashes of the challenge token and the
6-digit OTP in an expiring `EmailVerification` document, and emails the plain
code once. A `User` is created only after the code matches. Codes expire after
`EMAIL_OTP_TTL_MINUTES`, lock after `EMAIL_OTP_MAX_ATTEMPTS` wrong entries, and
resends are limited by `EMAIL_OTP_MAX_RESENDS` and
`EMAIL_OTP_RESEND_SECONDS`. Signing in with Google or Facebook marks the email
as verified; accounts created before this flow can confirm their email from the
Security tab of `/profile`. When SMTP is unavailable in development, the API
returns a `devOtp` field so the flow can be tested locally; production never
returns the code.

Passwords are hashed with bcrypt and are never returned by the API. The
password policy requires at least eight characters, at least three character
categories, no common password, and no use of the player's name or email.
The server is authoritative; the client only provides immediate feedback.

Sessions use an HTTP-only cookie and MongoDB-backed storage. An `authVersion`
on the user and session allows password changes, password resets, and “sign
out other devices” to invalidate older sessions. Login attempts are recorded
as `LoginEvent` documents with a hashed session identifier and masked IP data.

## API overview

All private user and game endpoints require the current session.

### User endpoints

- `GET /api/users/me` returns the profile, verification state, and stats.
- `PATCH /api/users/me` updates profile, mode, and preferences.
- `PATCH /api/users/me/password` changes or adds a password.
- `GET /api/users/me/security` returns verification and security checks.
- `POST /api/users/me/logout-others` revokes other devices.
- `GET /api/users/me/logins` returns login history and device summaries.
- `GET /api/users/me/achievements` returns achievement progress.
- `POST /api/users/me/deactivate` soft-deletes the account after `DELETE`
  confirmation and a current-password check when one exists.
- `GET /api/users/leaderboard?limit=25` returns public rankings.

### Game endpoints

- `GET /api/game/modes` returns available mode metadata.
- `POST /api/game/start` starts a puzzle session.
- `POST /api/game/answer` evaluates a numeric answer.
- `POST /api/game/expire` records a server-confirmed timeout.
- `POST /api/game/skip` skips the active puzzle.
- `POST /api/game/quit` abandons the current game.
- `GET /api/game/stats` returns player statistics.
- `GET /api/game/history` returns puzzle history.
- `GET /api/game/history/:sessionId` returns one puzzle result.
- `GET /api/game/games` returns completed game summaries.
- `GET /api/game/games/:gameId` returns one game summary.

Requests are validated with Joi before reaching game services. Responses use
JSON and normally contain `success`, `data`, and/or `message`.

## External integrations

- **Banana API:** supplies puzzle images and numeric solutions. The server
  applies a timeout, retries failed requests, validates the response, and
  never sends the solution before the player submits.
- **Google/Facebook:** Passport OAuth creates or links a user identity.
- **SMTP:** Nodemailer sends email-verification OTPs, welcome messages,
  password-reset links, password-change notices, and login confirmations when
  configured.
- **MongoDB:** stores application records and Express sessions.

## Audio and accessibility

Sound effects and background music are synthesized with the Web Audio API, so
the project does not depend on external audio files. Browser autoplay rules
mean audio is unlocked after a user gesture. SFX, music, and volume settings
are stored locally under `bq-audio-settings`.

The application supports a reduced-motion preference through `MotionConfig`
and responsive layouts for mobile browsers. The profile page groups settings
into identity, appearance, notifications, security, activity, privacy, and
account-management tabs. Numeric answers can be entered through the on-screen
controls and supported keyboard input.

## Commands and validation

Run commands from the relevant project directory:

```bash
# server/
npm run lint
npm test

# client/
npm run lint
npm run build
npm run preview
```

The client build verifies the production bundle. Oxlint checks the client and
server source. The server test command is configured with Node's test runner.
See [docs/testing.md](./docs/testing.md) for manual acceptance scenarios and
evidence to capture.

## Documentation

- [Architecture](./docs/architecture.md) - system design, Mermaid diagram,
  request path, and final folder tree.
- [Events](./docs/events.md) - browser, HTTP, timer, and domain events.
- [Interoperability](./docs/interoperability.md) - API and external-system
  contracts.
- [Virtual identity](./docs/virtual-identity.md) - accounts, sessions, and
  security controls.
- [Version control](./docs/version-control.md) - repository workflow and
  development history.
- [Testing](./docs/testing.md) - automated commands and manual verification.
- [References](./docs/references.md) - project, library, and external API
  sources.

## Attribution and academic submission

The assignment brief requires the source code, a working implementation,
testing evidence, and clear acknowledgement of external code or guidance.
External libraries are recorded in the client and server package manifests and
lock files. The [references page](./docs/references.md) lists the principal
services and technologies used by this project.
