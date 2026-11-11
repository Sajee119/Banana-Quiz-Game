# Interoperability

Interoperability is the ability of separate systems to exchange data and
operate together. Banana Quiz demonstrates this through the React client,
Express API, MongoDB persistence, OAuth providers, email delivery, and the
external Banana question service.

## System boundaries

| System | Integration | Data exchanged |
| --- | --- | --- |
| React client and Express API | JSON REST over HTTP | credentials, game sessions, scores, profile data |
| Express and MongoDB | Mongoose models | users, games, scores, sessions, login events |
| Express and Banana API | HTTP request with timeout/retry handling | banana question image and solution |
| Express and Google/Facebook | Passport OAuth callbacks | provider identity and profile information |
| Express and SMTP | Nodemailer | email OTPs, password reset, welcome, and login notifications |

The client uses a shared Axios instance in
[client.js](../client/src/api/client.js). It sends cookies with
`withCredentials: true`, uses JSON request bodies, and exposes grouped
`authApi`, `userApi`, and `gameApi` methods. The server returns a consistent
`success`, `message`, and/or `data` shape.

## Example contract

Email/password sign-up uses a two-request JSON exchange. The first request
starts a verification challenge and never creates an account:

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Banana Player",
  "email": "player@example.com",
  "password": "correct-horse-battery"
}
```

The server responds with `202 Accepted`, a `verificationId` challenge token,
the masked email, expiry and resend metadata, and `otpLength: 6`. The OTP is
delivered by SMTP. The client then submits:

```http
POST /auth/register/verify
Content-Type: application/json

{
  "verificationId": "64-character-hex-challenge-token",
  "otp": "123456"
}
```

Only a matching, unexpired code creates the `User` and session. `410` means the
challenge expired or is missing, `429` means it is locked or the resend limit
was reached, and `400` reports invalid input with the remaining attempts.

Starting a banana-value calculation game is a client-to-server contract:

```http
POST /api/game/start
Content-Type: application/json

{
  "mode": "classic",
  "gameId": "browser-generated-id",
  "quizCount": 10,
  "quizTimeSeconds": 30,
  "leaderboardEligible": true
}
```

The route validates the payload with Joi and returns a session containing the
puzzle image, timer metadata, and a server-controlled session identifier. The
solution remains on the server until the answer is submitted or the timer
expires; the client never needs to know the database schema.

The answer contract is deliberately small:

```http
POST /api/game/answer
Content-Type: application/json

{
  "sessionId": "24-character-mongodb-id",
  "answer": 42
}
```

The server validates the integer range, evaluates the banana value, calculates
points, and returns the solution only after evaluation.

## Compatibility and failure handling

- CORS is restricted to the configured client origin.
- API requests have timeouts and the client converts API errors into friendly
  messages.
- External question requests have configurable timeout and retry settings.
- OAuth and SMTP integrations are optional deployment concerns controlled by
  environment variables. Email/password sign-up requires SMTP in production
  because the account is only created after the emailed OTP is verified.
- Validation at the API boundary prevents malformed client data from reaching
  services or the database.

These boundaries allow the frontend and backend to evolve independently as
long as the documented JSON contracts remain compatible.
