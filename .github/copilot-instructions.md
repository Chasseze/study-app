This repository is a small single-page React app bootstrapped with Create React App.

Quick orientation
- Entry point: `src/index.js` mounts `<App />` into `#root`.
- Main UI & logic: `src/App.js` — a single-file, stateful React component (no backend). It contains inline SVG icons, a simple markdown renderer (`renderMarkdown`), modal UI, and local in-memory state for "topics".
- Tests: `src/App.test.js` uses React Testing Library and expects text present in the rendered output.

What an AI coding agent should know (actionable)
- State and persistence: topics are stored only in component state (useState). There is no API or localStorage in the code — changes are ephemeral. If asked to persist data, add a clear file or network contract (e.g., localStorage keys or a `/api` interface) and implement consistently.
- Markdown: `renderMarkdown` is a custom, regex-based renderer inside `src/App.js`. When modifying markdown behavior, update this function and the preview which uses `dangerouslySetInnerHTML`.
- Link preview: clicking links sets `previewUrl` and opens an `iframe` sandboxed with `allow-same-origin allow-scripts allow-popups allow-forms`. Embedding failures are handled by a hidden fallback element in the DOM.
- Styling approach: inline style objects throughout `src/App.js`. Prefer editing styles in-place unless extracting a CSS module or component library.
- Icons: app uses embedded SVG components (e.g., `BookIcon`, `TrashIcon`). Reuse these components rather than adding an external icon library.

Build / test / run commands (from `package.json`)
- Start dev server: `npm start` (runs `react-scripts start`, serves at http://localhost:3000)
- Production build: `npm run build` (outputs to `build/`)
- Run tests: `npm test` (react-scripts test, watch mode)

Project-specific conventions and patterns
- Single-file view: `src/App.js` combines UI, tiny utilities (markdown), and local state. When implementing new features, prefer small focused components in `src/` and keep prop/state boundaries clear.
- No routing: There is no `react-router` or multi-page routing; add only if a clear need arises and document the route contract.
- Minimal dependencies: project uses only React, react-scripts, and testing libraries. Avoid adding large UI frameworks without justification.
- Accessibility: UI uses semantic elements sparingly. If adding components, prefer accessible HTML (labels, button elements, `aria-*` where relevant).

Examples to reference
- Add image flow: `handleAddImage()` appends `![Image](url)` to the editor content — update both editor textarea and preview behavior when changing markdown syntax.
- Auto-save: `useEffect` in `src/App.js` debounces editor changes (1s) to update topic content in state — preserve or replace this behavior when altering saving logic.
- Deleting topic: `handleDeleteTopic(id)` confirms with `window.confirm` then removes item from `topics` state and updates selection.

When asked to modify code
- Keep changes minimal and local: prefer small component extractions (e.g., move Modal to `src/components/Modal.js`) and update imports.
- If introducing persistence, add a single clear abstraction (e.g., `src/lib/storage.js`) and use it from `App.js`. Document the contract in code comments.
- Update tests: when changing UI text or behavior, adjust `src/App.test.js` (this repo has a single simple test). Add tests using React Testing Library conventions used in the repo.

Files to inspect for context
- `package.json` (scripts & deps)
- `README.md` (created by CRA)
- `src/App.js`, `src/index.js`, `src/App.test.js`

If anything here is unclear or you need more ground truth (build steps, CI, or desired persistence), ask the maintainer before making global changes.

End.
