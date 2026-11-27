# Banana Quiz: Video Submission Recording Outline

> **Use this as preparation, not narration to read aloud.** The assignment brief
> says generative AI may be used for code, but not for the video. Write your own
> spoken explanation, use your own voice, and check with your tutor if you are
> unsure whether AI-generated preparation notes are permitted. Be accurate about
> which parts you personally developed and what external help or sources you used.

**Target length:** about 9 minutes 30 seconds; do not exceed 10 minutes.
**Format:** one continuous screen recording with your own spoken commentary.
Keep cuts and effects minimal. Use a test account and avoid showing passwords,
OTP codes, private email, or environment secrets.

## Before recording

- Start the client and server and confirm the demo works.
- Sign in with a prepared test account; avoid relying on a live OTP or OAuth
  provider during the recording.
- Close unrelated tabs and notifications. Keep the browser and source editor
  at readable zoom.
- Have the project open in the browser and editor, plus the four short theme
  sections in `docs/`.
- Check the Git evidence you plan to show with `git log --oneline` and
  `git branch --all`. Only describe branches, merges, or commits that you have
  personally verified.
- Prepare an honest, brief explanation of your own contribution and the
  external software, sources, or guidance used.

## Timed outline

### 0:00–1:10 — Show the working game first

**On screen**

1. Show the Banana Quiz landing page and identify the project.
2. Open the game mode picker and point out Standard Easy, Standard Hard, and
   Custom.
3. Start a round, show the puzzle and countdown, submit one answer, and show
   the feedback/score.

**Speaking prompts**

- What problem or experience does the game provide?
- What should viewers notice about the puzzle, timer, and answer feedback?
- Explain briefly that this is a React browser client connected to an Express
  API, with MongoDB and an external Banana question service.

Keep the demo moving; leave the deeper explanation for the four themes.

### 1:10–2:55 — Version control and component organization

**On screen**

- Show the repository structure: `client/`, `server/`, and `docs/`.
- Show a small, relevant part of Git history or branch history. Do not imply
  that a workflow was used unless the visible evidence confirms it.
- If useful, show the corresponding project notes in
  [docs/version-control.md](./docs/version-control.md).

**Speaking prompts**

- How does splitting the browser UI, API/business rules, persistence, and
  documentation make changes easier to locate and review?
- Pick one real feature and trace the related client, server, and documentation
  responsibilities.
- What does Git history let you inspect or recover? What does it not prove
  (for example, correctness or test quality)?
- Reflect on a real decision or limitation: how were changes isolated and
  integrated in this project, and what would branches, focused commits, and
  code review improve if the team or project grew?
- Mention dependency manifests/lock files as part of reproducible collaboration.

**Evidence to point to:** `client/src/pages/`, `server/src/`, `docs/`, and
verified Git history.

### 2:55–4:35 — Event-driven programming

**On screen**

- In the running game, demonstrate an answer or skip action and the resulting
  feedback.
- Show the answer/timer handlers in
  [GamePage.jsx](./client/src/pages/GamePage.jsx), then the corresponding
  service logic in [game.service.js](./server/src/services/game.service.js).
- Refer to [docs/events.md](./docs/events.md) if needed.

**Speaking prompts**

- Identify concrete event sources: button/keyboard input, form submission,
  countdown timers, and HTTP responses.
- Trace one event from player action → React handler/state update → HTTP
  request → Express route/service → JSON response → updated UI.
- Explain how asynchronous requests and timer expiry affect the flow.
- Point out how the client avoids duplicate submissions and how the server
  atomically claims a game session so a late or repeated answer cannot score
  twice.
- Reflect on why event-driven handling fits an interactive game, and what
  complexity it adds (timing, duplicate events, and error states).

### 4:35–6:40 — Interoperability

**On screen**

- Show the shared API client in
  [client.js](./client/src/api/client.js) and a game request/route or the
  architecture diagram in [docs/architecture.md](./docs/architecture.md).
- Refer to [docs/interoperability.md](./docs/interoperability.md) for the
  boundaries and contract examples.

**Speaking prompts**

- Define interoperability in the context of this project: separately built
  components exchanging data through agreed contracts.
- Explain the client/server boundary: JSON over HTTP, shared endpoint
  expectations, and session cookies sent with requests.
- Trace how the server gets a puzzle from the Banana API and stores game data
  in MongoDB. Mention OAuth and SMTP only if you can explain their actual role.
- Explain why the puzzle solution stays on the server until an answer is
  evaluated.
- Reflect on one integration risk (network failure, timeout, malformed data,
  or a changed contract) and the existing handling or a realistic improvement.
- Compare this API-based separation with putting all game logic in the browser;
  discuss the trade-offs without claiming either approach is universally best.

### 6:40–8:45 — Virtual identity

**On screen**

- Show the sign-in or registration/verification experience using a test
  account; do not expose credentials or a live verification code.
- Show the relevant auth/session code or
  [docs/virtual-identity.md](./docs/virtual-identity.md).

**Speaking prompts**

- Explain virtual identity here: a verified account linked to a server-side
  session, used to identify the player for protected routes, scores, and
  profile data.
- Describe the email registration sequence: a six-digit OTP challenge is
  verified before the account is created. Contrast this with Google/Facebook
  OAuth if relevant.
- Explain password hashing, the HTTP-only session cookie, protected routes,
  and why the browser should not decide whether a user is authorized.
- Describe one security strength and one limitation/trade-off. For example,
  cookies need appropriate secure and same-site settings; email verification
  depends on email delivery; OAuth delegates identity to another provider.
- Mention session revocation or logout as part of the identity lifecycle.
- Avoid saying the system is perfectly secure; describe the controls and what
  they are intended to protect.

### 8:45–9:30 — Reflection and close

**On screen**

- Return briefly to the running game or show the project structure.

**Speaking prompts**

- Which of the four themes most influenced a concrete design decision?
- What is one limitation you would address next, and why?
- Summarize how the four themes work together in this particular game.
- Close by confirming where the source code and supporting evidence are
  provided with the submission.

## Final checks

- [ ] Video is under 10 minutes and uses your own voice.
- [ ] It starts with a short demonstration, then discusses all four themes.
- [ ] Each theme is tied to specific code or observed behavior, with at least
  one justified trade-off or limitation.
- [ ] Any claims about Git workflow and personal contribution are accurate and
  supported by your actual evidence.
- [ ] No secrets, personal account details, or private user data are visible.
- [ ] Source code and required presentation evidence are submitted separately
  as required by the assignment brief.