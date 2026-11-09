# Virtual identity

Virtual identity is the representation of a player in a networked application.
Banana Quiz creates an identity from a local account or an external OAuth
identity, then uses a server-side session to authorize private calculation
games, saved scores, and profile data.

## Identity lifecycle

1. A player registers with a name, email, and password, or uses Google/Facebook.
2. For email/password sign-up, the server stores a pending OTP challenge and
   emails a 6-digit code. No `User` exists until the code is verified.
3. On successful verification, the server creates the `User`, marks the email
   verified, and logs the player into an Express session.
4. Google/Facebook sign-in finds or creates a provider account and treats its
   email as verified.
5. The browser sends the session cookie with subsequent API requests.
6. Protected routes use `ensureAuthenticated` before accessing account or game
   data.
7. Logout destroys the session and clears the browser cookie.

Passwords are hashed with bcrypt and are not returned by the API. The server
enforces the password policy; the client mirrors it with a live strength
indicator for usability.

## Email verification

Registration is intentionally two-phase. The pending challenge stores a
bcrypt hash of the password plus SHA-256 hashes of the challenge token and
6-digit OTP; the plain password and plain code are never persisted. The OTP
expires after `EMAIL_OTP_TTL_MINUTES`, locks after `EMAIL_OTP_MAX_ATTEMPTS`
wrong submissions, and can be resent at most `EMAIL_OTP_MAX_RESENDS` times with
a cooldown of `EMAIL_OTP_RESEND_SECONDS`. A MongoDB TTL index removes abandoned
challenges automatically.

The verification page shows the masked email, countdown, attempts remaining,
and resend state. In local development, if SMTP is unavailable, the API returns
`devOtp` so the flow remains testable; production never exposes the code.
Signed-in accounts that predate this flow can confirm their email from the
profile Security tab using the same challenge model.

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

Players can update their profile, confirm their email, choose reduced motion,
control notification and leaderboard preferences, inspect login history, sign
out other devices, export their data, or deactivate their account. Deactivation
is a soft delete: the account is marked inactive, its sessions are revoked, and
sign-in is refused. This makes identity both a security boundary and a visible
part of the calculation-game experience.
