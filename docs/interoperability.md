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
| Express and SMTP | Nodemailer | password reset, welcome, and login notifications |

The client uses a shared Axios instance in
[client.js](../client/src/api/client.js). It sends cookies with
`withCredentials: true`, uses JSON request bodies, and exposes grouped
`authApi`, `userApi`, and `gameApi` methods. The server returns a consistent
`success`, `message`, and/or `data` shape.

## Example contract

Starting a quiz is a client-to-server contract:

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
question data and a server-controlled session identifier. The client never
needs to know the database schema.

## Compatibility and failure handling

- CORS is restricted to the configured client origin.
- API requests have timeouts and the client converts API errors into friendly
  messages.
- External question requests have configurable timeout and retry settings.
- OAuth and SMTP integrations are optional deployment concerns controlled by
  environment variables.
- Validation at the API boundary prevents malformed client data from reaching
  services or the database.

These boundaries allow the frontend and backend to evolve independently as
long as the documented JSON contracts remain compatible.

