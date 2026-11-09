# Testing and verification

Testing for Banana Quiz combines static checks, build verification, API
boundary checks, and manual browser scenarios. The goal is to verify both the
distributed components and the user-visible flows.

## Available checks

Run these commands from the indicated directory:

```bash
# server/
npm run lint
npm test

# client/
npm run lint
npm run build
```

The client build verifies that the Vite production bundle can be generated.
Oxlint checks the JavaScript and JSX source. The server's `node --test`
command is the configured test entry point; test files should be added under
`server/` as behavior is formalized.

## Manual acceptance scenarios

1. Start MongoDB, configure `server/.env`, then start the server and client.
2. Open the landing page and verify public navigation and leaderboard access.
3. Register a new account: confirm the app opens `/verify-email`, the masked
   email and countdown appear, an incorrect code reduces the attempt count, and
   a correct code creates the account and redirects to the dashboard.
4. Confirm a pending sign-up can resend after the cooldown, shows the resend
   limit, and restarts cleanly when the challenge expires.
5. Sign out and sign back in with an incorrect and then correct password.
6. Start Standard Easy, Standard Hard, and Custom games; calculate a value
   correctly, submit an incorrect value, skip a puzzle, allow a timeout, and
   quit a game.
7. Confirm score, streak, achievements, history, and leaderboard updates.
8. Request a password reset and validate the single-use token behavior.
9. From the profile Security tab, request and confirm email verification for an
   older unverified account, then refresh to confirm the verified state.
10. Inspect profile security data, change preferences, export data, and sign out
    other devices.
11. Exercise Google/Facebook sign-in when provider credentials are configured.
12. Open the Danger Zone, confirm deactivation requires `DELETE` (and the
    current password for local accounts), and verify the account can no longer
    sign in.
13. Repeat key flows with invalid input and confirm clear errors without
    exposing private data.

## Email-verification assertions

- `POST /auth/register` returns `202` and does not create a `User`.
- The response never contains the plain OTP in production.
- Only the SHA-256 hashes of the challenge token and OTP are stored.
- A wrong OTP increments the attempt count and reports the remaining attempts.
- The challenge locks after `EMAIL_OTP_MAX_ATTEMPTS` wrong codes.
- A resend rotates the OTP, resets attempts, and respects the cooldown and
  `EMAIL_OTP_MAX_RESENDS` limit.
- An expired or missing challenge returns `410` and the UI offers a restart.
- A correct OTP creates exactly one verified user, starts a session, and
  deletes the challenge.
- OAuth accounts are reported as email-verified without an OTP.

## Calculation-game assertions

- The puzzle image is visible before an answer is submitted.
- The solution is not present in the start response.
- A correct value awards points and updates the streak.
- A wrong value returns the solution and awards zero points.
- A late answer cannot score an expired session.
- Duplicate answer requests cannot score the same session twice.
- A completed game appears in the overview and history pages.

## Test evidence to capture

For the assignment video or supporting material, capture the command output,
browser flow, API responses, and relevant database records without recording
secrets. Test both successful and failure paths, especially authentication,
timeouts, expired sessions, and malformed game requests.
