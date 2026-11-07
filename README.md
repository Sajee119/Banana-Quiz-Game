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
- **Nodemailer** optionally sends password-reset and security notifications.
- The external **Banana API** supplies the calculation puzzles.

## Features

- Banana-value calculation puzzles with server-side answer validation.
- Standard Easy, Standard Hard, and Custom game configurations.
- Countdown timers, answer feedback, skip, timeout, and quit handling.
- Base points, speed bonuses, streak multipliers, and mode scoring.
- Persistent scores, game history, achievements, and public leaderboard.
- Email/password registration and login.
- Google and Facebook OAuth login.
- Password strength policy, reset links, and session revocation.
- Profile settings, reduced-motion preference, audio controls, and leaderboard
  visibility.
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
│       ├── services/       # Game, mail, API, and history logic
│       └── utils/          # Shared validation and logging helpers
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
- Optional SMTP credentials for real email delivery.

## Installation and local development

Install dependencies in both applications:

```bash
cd server
npm install

cd ../client
npm install
```

Create the server environment file:

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
| `SMTP_*`, `MAIL_FROM` | Optional email delivery |
| `GAME_*` | Scoring and game timing configuration |
| `BANANA_API_*` | External question timeout and retry settings |

Never commit `.env` files, OAuth secrets, SMTP passwords, or database
credentials.

## Browser routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Product landing page, features, modes, FAQ, and leaderboard preview |
| `/login` | Public | Sign in or create an account |
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
| `/profile` | Signed in | Manage identity, preferences, password, devices, and login history |

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

- `POST /auth/register` creates a local account and starts a session.
- `POST /auth/login` authenticates with email and password.
- `GET /auth/google` and `GET /auth/facebook` start OAuth flows.
- `POST /auth/logout` ends the current session.
- `GET /auth/status` returns the current authentication state.
- `POST /auth/forgot-password` requests a reset link.
- `GET /auth/reset-password/validate?token=...` validates a reset token.
- `POST /auth/reset-password` consumes a valid token and revokes sessions.

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

- `GET /api/users/me` returns the profile and current statistics.
- `PATCH /api/users/me` updates profile and preferences.
- `PATCH /api/users/me/password` changes or adds a password.
- `GET /api/users/me/security` returns account security information.
- `POST /api/users/me/logout-others` revokes other devices.
- `GET /api/users/me/logins` returns login history and device summaries.
- `GET /api/users/me/achievements` returns achievement progress.
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
- **SMTP:** Nodemailer sends welcome, password-reset, password-change, and
  login-confirmation messages when configured.
- **MongoDB:** stores application records and Express sessions.

## Audio and accessibility

Sound effects and background music are synthesized with the Web Audio API, so
the project does not depend on external audio files. Browser autoplay rules
mean audio is unlocked after a user gesture. SFX, music, and volume settings
are stored locally under `bq-audio-settings`.

The application supports a reduced-motion preference through `MotionConfig`
and responsive layouts for mobile browsers. Numeric answers can be entered
through the on-screen controls and supported keyboard input.

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
