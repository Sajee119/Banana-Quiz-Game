# Architecture

## Architecture diagram

```mermaid
flowchart LR
    Browser["React/Vite browser client"]
    API["Express API"]
    DB[("MongoDB")]
    Banana["Banana question API"]
    OAuth["Google / Facebook OAuth"]
    SMTP["SMTP email service"]

    Browser -- "JSON/HTTP + session cookie" --> API
    API -- "Mongoose models and sessions" --> DB
    API -- "questions" --> Banana
    API -- "OAuth callbacks" --> OAuth
    API -- "OTP and security emails" --> SMTP
```

### Summary

Banana Quiz uses a distributed client-server architecture in which the
React/Vite browser client owns presentation, navigation, and interaction while
the Express API owns authentication, game rules, validation, and integration
with MongoDB and external services; the browser and API communicate through
JSON over HTTP with a server-side session cookie.

## Client layer

The React application defines routes and pages for landing, authentication,
email verification, dashboard, mode selection, banana-value calculation, game
overview, achievements, leaderboard, history, and profile management. Shared
components provide buttons, cards, audio controls, OTP entry, and
authentication guards. `AuthProvider` restores the session on startup and
shares the current user and statistics with protected pages. The profile page
uses tabs for identity, appearance, notifications, security, activity, privacy,
and account deactivation.

## Server layer

`server/src/app.js` configures Helmet, CORS, compression, JSON parsing,
logging, rate limiting, sessions, Passport, route mounting, and error
handling. Route modules validate input and delegate business rules to
services. Services keep game scoring, achievements, login history, mail,
email-verification challenges, and external question retrieval out of the
route layer.

## Persistence

Mongoose models represent users, game sessions, completed games, scores,
password reset tokens, email verification challenges, and login events.
MongoDB stores both application data and server-side sessions. User-specific
routes always use the authenticated user ID when reading or changing private
data. Pending sign-up challenges expire automatically through a MongoDB TTL
index and store only hashes of the challenge token and OTP.

## Main request path

For a banana-value answer, the client calls `POST /api/game/answer`. The
protected route validates the session ID and numeric answer, the game service
evaluates the result and updates persistence, and the response returns the
solution, points, feedback data, and updated statistics. The client then
renders feedback and advances to the next puzzle.

## Email verification request path

1. `POST /auth/register` validates the form, hashes the pending password, and
   creates a short-lived `EmailVerification` record. No `User` is written.
2. The mail service sends a 6-digit OTP. The response contains a random
   challenge token, the masked email, expiry, resend timing, and (in local
   development only) a fallback `devOtp` when SMTP delivery fails.
3. The browser opens `/verify-email` with the challenge token. The page fetches
   `/auth/verification/status` to show the countdown, attempts remaining, and
   resend availability.
4. `POST /auth/register/verify` hashes the submitted code and compares it in
   constant time. Success creates a verified `User`, starts the session, sends
   the welcome/login notifications, and deletes the challenge.
5. Expired, locked, over-resend, or already-used challenges are rejected with
   an explicit error so the client can offer a restart or resend action.
6. Signed-in accounts that were created before OTP verification use the
   `/auth/email/verify/*` endpoints from the profile Security tab; the same
   challenge model is reused with `kind: "email_verification"`.

## Final folder tree

Generated build output and dependency folders are omitted from this tree:
`client/node_modules/`, `server/node_modules/`, and `client/dist/`.

```text
Banana-Quiz-Game/
├── ASSIGNMENT_BRIEF.md
├── README.md
├── client/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   └── src/
│       ├── api/
│       │   └── client.js
│       ├── assets/
│       ├── audio/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── lib/
│       ├── pages/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
├── docs/
│   ├── architecture.md
│   ├── events.md
│   ├── interoperability.md
│   ├── references.md
│   ├── testing.md
│   ├── version-control.md
│   └── virtual-identity.md
└── server/
    ├── .env.example
    ├── package.json
    ├── package-lock.json
    ├── server.js
    └── src/
        ├── config/
        ├── middleware/
        ├── models/
        ├── routes/
        ├── services/
        └── utils/
```
