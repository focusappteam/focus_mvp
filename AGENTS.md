# AGENTS.md

Operational notes for working in `focus_mvp`. FOCUS is a React 19 + Vite 7 SPA
(the README and `index.html` are in Spanish; UI copy is Spanish).

## Commands

Only these npm scripts exist — there is **no** `test` or `typecheck` script.
- `npm run dev` — Vite dev server on `http://localhost:5173`
- `npm run build` — production build to `dist/`
- `npm run lint` — ESLint v9 flat config over `**/*.{js,jsx}` (ignores `dist`)
- `npm run preview` — serve the built bundle locally

Do not invent test/typecheck commands; if the task needs them, ask the user.

## Security: `.env` is already committed

`.env` is in `.gitignore` but is currently tracked in the repo and contains
real keys: `VITE_GEMINI_API_KEY`, `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`. Read from
`src/utils/supabase.js` and `src/hooks/useGeminiAdvice.js`.
- Do **not** add new secrets to `.env` and do not commit changes to it.
- Treat the existing values as already-public; rotate them out-of-band if the
  user asks for "real" secrets.

## Architecture (worth knowing before editing)

Entry chain: `index.html` → `src/main.jsx` → `App.jsx` → features.

Provider nesting is intentional and order-sensitive. In `main.jsx`:
`BrowserRouter` → `AuthProvider` → `App`. Inside `App` (see `App.jsx`):
`TimerProvider` → `BoardProvider` → `OnboardingProvider` → `<Layout>` →
`<Board>`. The `OnboardingProvider` comment in `main.jsx:12-16` explains why
it sits outside the board/timer providers.

Routes (`src/App.jsx`): `/` → `/login`; `/login`, `/register`, `/welcome`,
`/checkemail` are public; `/app` is wrapped in `ProtectedRoute`
(`src/components/auth/ProtectedRoute.jsx`); `*` → `/login`.

`src/features/board/boardService.js` is **empty by design** — all board data
flows through `src/contexts/BoardContext.jsx`, which talks to Supabase
directly. Supabase client lives in `src/utils/supabase.js` and is also used by
`AuthContext.jsx` for auth + the `profiles` table.

State is persisted to `localStorage` under keys `workspaces`,
`activeWorkspaceId`, `tasks`. `BoardContext` clears them on logout/switch
(BoardContext.jsx:28-40).

Drag-and-drop: `@dnd-kit/core` + `@dnd-kit/sortable`. Icons: `lucide-react`.
AI: `@google/genai` via `useGeminiAdvice`. Styling is CSS Modules colocated
with components (e.g. `Board.jsx` + `board.module.css`).

## Onboarding system

Steps are declared in `src/config/onboardingSteps.js` and rendered by
`src/components/onboarding/OnboardingOverlay.jsx`. Each step has a `target`
string id (e.g. `create-workspace-btn`, `create-task-btn`, `task-card`,
`focus-mode-btn`, `stats-btn`) and an `isCompleted(ctx)` predicate.

To make a target element highlightable, attach it via
`useOnboardingRef("your-id")` (defined in `src/hooks/useOnboarding.js`).
Existing wiring lives in `Sidebar.jsx`, `Header.jsx`, `FocusButton.jsx`,
and `Board.jsx`. A step with `waitForTarget: true` blocks the overlay until
the target mounts.

## Conventions

- JavaScript only (`.jsx`/`.js`); no TypeScript despite React 19.
- ESLint flat config (`eslint.config.js`): `no-unused-vars` ignores names
  starting with `^[A-Z_]`, so intentionally-unused React imports/components
  (capitalised) won't error. Other unused vars will.
- Vite uses `@vitejs/plugin-react-swc` (SWC, not Babel).
- Vercel deploy: `vercel.json` rewrites all paths to `/index.html` for SPA
  routing. No CI workflows exist (`.github/` is absent).

## Common gotchas

- New onboarding steps need **both** a `target` id in
  `onboardingSteps.js` *and* a `useOnboardingRef(id)` call on the actual DOM
  element, or `waitForTarget: true` will stall the tour.
- `BoardContext` clears `localStorage` when `user` is null — be careful when
  writing to those keys outside the context.
- `App.jsx` declares `PublicRoute` after `AppContent`; keep new routes inside
  the `PublicRoute` wrapper to keep logged-in users bounced to `/app`.
- Env vars must be prefixed `VITE_` to be exposed to the client (Vite rule).
