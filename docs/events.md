# Events and event-driven programming

Banana Quiz combines browser events, asynchronous HTTP events, timer events,
and server-side domain events. The user interface reacts to events rather than
running as one linear procedure.

## Client-side events

Examples in the React client include:

- form submission for login, registration, and answers;
- button clicks for starting, skipping, quitting, and logging out;
- `useEffect` lifecycle events for restoring the session and starting a quiz;
- `setInterval` timer events for the per-question countdown;
- `setTimeout` feedback events before the next question or game summary;
- `popstate` handling while a game is active;
- keyboard input for selecting numeric values.

In [GamePage](../client/src/pages/GamePage.jsx), an answer event submits the
calculated banana value, records the result in React state, updates statistics,
displays the solution and feedback, and then starts the next puzzle.
`busyRef` prevents duplicate submissions while an asynchronous request is in
progress.

## Server-side events

The Express server handles HTTP requests as events routed to authentication,
user, and game handlers. A game request can cause several state changes:

1. The server validates the request.
2. The game service obtains a banana-value puzzle.
3. The answer or timeout is evaluated.
4. The score, streak, achievements, and game history are updated.
5. A JSON response containing the result, solution, points, and statistics is
   emitted to the client.

Authentication attempts are recorded as `LoginEvent` documents for both
successful and failed attempts. The login history service also derives device
summaries and removes old records to keep the history bounded.

## Event flow

```text
User action
   -> React handler
   -> Axios request
   -> Express route and service
   -> MongoDB / external Banana API
   -> JSON response
   -> React state update and rendered feedback
```

This design keeps event producers (browser actions and timers) separate from
event consumers (React handlers and Express services), which makes the game
responsive and allows slow operations to be handled asynchronously.
