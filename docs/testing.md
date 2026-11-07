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
3. Register a new account and confirm redirection to the dashboard.
4. Sign out and sign back in with an incorrect and then correct password.
5. Start Standard Easy, Standard Hard, and Custom games; calculate a value
   correctly, submit an incorrect value, skip a puzzle, allow a timeout, and
   quit a game.
6. Confirm score, streak, achievements, history, and leaderboard updates.
7. Request a password reset and validate the single-use token behavior.
8. Inspect profile security data and sign out other devices.
9. Exercise Google/Facebook sign-in when provider credentials are configured.
10. Repeat key flows with invalid input and confirm clear errors without
    exposing private data.

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
