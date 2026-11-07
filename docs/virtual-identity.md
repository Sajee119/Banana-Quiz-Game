# Virtual identity

Virtual identity is the representation of a player in a networked application.
Banana Quiz creates an identity from a local account or an external OAuth
identity, then uses a server-side session to authorize private calculation
games, saved scores, and profile data.

## Identity lifecycle

1. A player registers with a name, email, and password, or uses Google/Facebook.
2. The server creates or finds a `User` record.
3. Passport logs the user into an Express session.
4. The browser sends the session cookie with subsequent API requests.
5. Protected routes use `ensureAuthenticated` before accessing account or game
   data.
6. Logout destroys the session and clears the browser cookie.

Passwords are hashed with bcrypt and are not returned by the API. The server
enforces the password policy; the client mirrors it with a live strength
indicator for usability.

## Session security

Sessions are stored in MongoDB through `connect-mongo`. The cookie is
HTTP-only, has a bounded lifetime, and uses secure/same-site settings based on
the deployment environment. The session contains an `authVersion`. When a
password is changed, a password is reset, or other devices are signed out,
the user version is incremented. Older sessions are rejected by the middleware
in [app.js](../server/src/app.js).

Password reset tokens are random, time-limited, single-use values. Only their
SHA-256 hashes are stored. Forgot-password responses are deliberately generic
so an attacker cannot discover whether an email is registered.

## Identity activity

Each sign-in attempt is stored as a `LoginEvent`. It records the method,
success/failure, reason, browser, operating system, coarse device type, and a
masked IP address for the account security page. The raw session ID is never
stored; a SHA-256 session hash is used to identify the current device.

Players can update their profile, choose reduced motion, control leaderboard
visibility, inspect login history, and sign out other devices. This makes
identity both a security boundary and a visible part of the calculation-game
experience.
