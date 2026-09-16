# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is an AI4Devs QA exercise: writing Playwright E2E tests against the `position` screen of "LTI" — a candidate/interview management system. The screen is a Kanban board where candidates are dragged between interview-process phases (columns), and dropping a card must trigger `PUT /candidates/:id` on the backend with the new stage.

The repo is a monorepo with two independently run apps:
- `backend/` — Express + TypeScript + Prisma (PostgreSQL) REST API, port `3010`.
- `frontend/` — Create React App (React 18, JS + some TSX), port `3000`. Contains the Playwright E2E test suite for this exercise.

The backend and frontend have separate `package.json`/`node_modules`; there is no workspace tooling tying them together. Always `cd` into the relevant directory before running its scripts.

## Commands

### Backend (`cd backend`)
- `npm run dev` — run API with hot reload (ts-node-dev) on `http://localhost:3010`.
- `npm run build` — compile TypeScript to `dist/`.
- `npm start` / `npm run start:prod` — run compiled build.
- `npm test` — run Jest unit tests (ts-jest). Run a single file: `npx jest src/application/services/candidateService.test.ts`.
- `npm run prisma:generate` — regenerate Prisma client after editing `prisma/schema.prisma`.
- DB: `docker-compose up -d` (from repo root) starts Postgres using `DB_USER`/`DB_PASSWORD`/`DB_NAME`/`DB_PORT` from `.env`.

### Frontend (`cd frontend`)
- `npm start` — run the React app on `http://localhost:3000` (the backend must also be running for data to load).
- `npm run build` — production build.
- `npm test` — CRA/Jest component tests (`jest.config.js`).
- `npx playwright test` — run the E2E suite in `frontend/tests/` (headless, all browsers configured in `playwright.config.ts`: chromium, firefox, webkit).
- `npx playwright test --ui` — interactive mode, preferred while developing a spec.
- `npx playwright test tests/<file>.spec.ts` — run a single spec file.
- `npx playwright show-report` — open the HTML report from the last run.
- First-time setup: `npx playwright install` (installs browser binaries).
- CI runs Playwright tests on push/PR to `main`/`master` via `frontend/.github/workflows/playwright.yml`; it does not start the frontend/backend dev servers itself, so specs must either mock network calls or the config's `webServer` must be configured before relying on a live app in CI.

There is no root-level build/test script; the root `package.json` only pins `dotenv` for Prisma env loading.

## Architecture

### Backend — layered/DDD-flavored structure
`backend/src` is split into three layers; requests flow `routes` → `presentation/controllers` → `application/services` → `domain/models` (which wrap Prisma calls directly — there is no repository layer yet):
- `domain/models/*.ts` — one class per Prisma entity (`Candidate`, `Position`, `Application`, `Interview`, `InterviewFlow`, `InterviewStep`, `InterviewType`, `Company`, `Employee`, `Education`, `WorkExperience`, `Resume`). These classes both hold data and perform their own Prisma persistence — see `backend/ManifestoBuenasPracticas.md` for the acknowledged DDD/SOLID gaps (e.g. `Candidate` mixes business logic with data access; no repository abstraction).
- `application/services/candidateService.ts` and `positionService.ts` — orchestrate model classes for each use case (add candidate, update interview stage, fetch candidates/positions).
- `application/services/fileUploadService.ts` — handles resume uploads via `multer`, mounted at `POST /upload`.
- `presentation/controllers/*.ts` — Express handler functions called from `routes/*.ts`; map HTTP req/res to service calls.
- `routes/candidateRoutes.ts` (`/candidates`) and `routes/positionRoutes.ts` (`/positions`) are mounted in `src/index.ts`.
- Prisma is attached to every request as `req.prisma` via middleware in `src/index.ts` (see the `Express.Request` augmentation there) rather than imported as a singleton in each file.
- `prisma/schema.prisma` defines the data model; `backend/ModeloDatos.md` has the full entity/relationship reference and an ERD (candidates apply to positions; positions belong to companies and an interview flow made of ordered steps; applications track a current interview step and have interviews scored by employees).
- `backend/api-spec.yaml` documents the HTTP contract (request/response shapes, validation patterns) — check it before changing request/response formats.

Key endpoints relevant to the E2E exercise:
- `GET /positions/:id/interviewflow` — the interview flow (columns) for a position.
- `GET /positions/:id/candidates` — candidates for a position, each with `currentInterviewStep`.
- `PUT /candidates/:id` — updates a candidate's `currentInterviewStep`/`applicationId` (this is the request the drag-and-drop E2E test must assert on).

### Frontend — Kanban board implementation
- `src/App.js` defines routes: `/` (dashboard), `/add-candidate`, `/positions`, `/positions/:id` (the Kanban board under test).
- `src/components/PositionDetails.js` is the board container: fetches the interview flow and candidates for a position, owns `stages` state, wraps columns in `react-beautiful-dnd`'s `DragDropContext`, and on drag end calls `PUT /candidates/:id` directly via `fetch` (not through `services/candidateService.js`, which only handles CV upload and candidate creation).
- `src/components/StageColumn.js` renders a `Droppable` column per interview step; `src/components/CandidateCard.js` renders a `Draggable` card per candidate.
- **No `data-testid` attributes exist yet anywhere in the frontend.** The exercise README recommends adding them (e.g. `position-title`, `phase-column-<name>`, `candidate-card-<id>`) — expect to add these to the components above to make Playwright selectors stable, since current tests would otherwise have to rely on fragile text/role selectors.
- Drag-and-drop is implemented with `react-beautiful-dnd`, which does not respond to simple mouse `click`/`drop` events — Playwright drag simulations need real `dragstart`/`dragover`/`drop` mouse-move sequences (see Playwright's drag-and-drop docs) or a helper that dispatches HTML5 DnD events.

## Testing conventions for this exercise

- E2E specs live in `frontend/tests/` (currently only the Playwright-generated `example.spec.ts` placeholder — replace/extend it with `position.spec.ts` per the exercise README).
- `playwright.config.ts` has no `baseURL` or `webServer` configured yet — tests currently need a full URL per `page.goto()` and the frontend/backend running manually, or the config should be updated to set `baseURL: 'http://localhost:3000'` and a `webServer` block.
- Per `README.md`, the two required scenarios are: (1) the position page loads with title, phase columns, and correctly-placed candidates; (2) dragging a candidate card to another column updates it visually and fires `PUT /candidate/:id` with the new stage and a successful response — assert on the network request via Playwright's `page.route`/`waitForRequest`, not just the UI state.
- Every prompt used to generate/iterate on tests must be logged, in order, in `/prompts/prompts-[iniciales].md` (prompts only, no responses) — this is a required deliverable, not optional documentation.
