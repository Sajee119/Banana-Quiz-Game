# Version control

Banana Quiz is maintained as a Git repository. The repository history records
incremental work on authentication, game play, UI refactoring, assets, and
merge integration. This gives the project an auditable development history
instead of treating the final source tree as the only evidence of development.

## Repository structure

- `client/` contains the React/Vite browser application.
- `server/` contains the Express API, authentication, game services, and
  MongoDB models.
- `docs/` contains the design, testing, and assignment evidence for the
  implementation.

## Development workflow

1. Create a focused branch for a feature or fix.
2. Make small, reviewable commits that describe the behavior being changed.
3. Run the relevant client or server checks before merging.
4. Merge the completed branch into `main` and verify the integrated result.

The history includes feature branches and merge commits, including separate
authentication and game-play work. This demonstrates distributed development
while preserving the final integration point on `main`.

## Why Git is useful here

Git provides:

- change tracking for both client and server code;
- rollback points when a change introduces a regression;
- branch isolation for independent features;
- merge history showing how work was combined;
- a reproducible source snapshot for the assignment submission.

Secrets are not part of the repository. Runtime values belong in
`server/.env`, which is created from `server/.env.example`.

## Evidence

The latest history can be inspected with `git log --oneline`. The root
[README](../README.md) documents the setup commands and project structure.

