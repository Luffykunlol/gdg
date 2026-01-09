# Copilot instructions for Civic Shield (gdg)

Purpose: Give AI coding agents immediate, actionable knowledge to be productive in this repo.

**Big Picture**:
- Frontend: static SPA under `gdg-frontend/` (Vanilla JS + Firebase Auth). Entry pages: `index.html`, `login.html`, `signup.html`, `dashboard.html`.
- Backend: two runtime options:
  - Cloud Functions: `gdg-backend/functions/index.js` — CommonJS Firebase HTTPS function exported as `api`.
  - Local server: `gdg-backend/local/index.js` — ES module Express app listening on port 5000 for local development.
- Data flow: frontend collects a document (text or PDF -> base64) and a question, POSTs to `/analyze`. Local dev uses `http://localhost:5000/analyze`; production uses the Firebase Functions HTTP endpoint.

**Key files to reference**:
- `gdg-backend/functions/index.js` — cloud entrypoint and example prompt for Gemini.
- `gdg-backend/local/index.js` — standalone server with richer systemInstruction and JSON response parsing.
- `gdg-frontend/dashboard.js` — shows how the frontend reads files and calls `/analyze` and how UI expects response fields.
- `gdg-frontend/firebase.js` — Firebase client config; Firebase Auth is used for gated routes.
- `gdg-backend/firebase.json` — functions config for emulator & deploy.

**API & payload contract (authoritative)**:
- Endpoint: POST `/analyze`
- Request JSON fields used by servers:
  - `fileData` (string|null): base64 payload for PDF WITHOUT the `data:...;base64,` prefix.
  - `documentText` (string|null): plaintext document content.
  - `mimeType` (string): e.g. `application/pdf` or `text/plain`.
  - `question` (string): user question.
  - `language` (string|null): preferred response language.
- Response JSON expected by UI (see `dashboard.js`):
  - `summary` (string), `answer` (string), `risk` (string), `actions` (string[])

Example request (frontend):
```json
{
  "fileData": "<base64-without-prefix>",
  "documentText": null,
  "mimeType": "application/pdf",
  "question": "Is this request for money legitimate?",
  "language": "English"
}
```

**Model / safety patterns to preserve**:
- The local server (`local/index.js`) defines an explicit `systemInstruction` and requests `responseMimeType: "application/json"` from Gemini — code assumes the model returns strict JSON.
- Cloud function (`functions/index.js`) composes a prompt and uses `gemini-pro` — keep prompt structure and response parsing consistent.
- When modifying prompts, ensure the output remains valid JSON or the caller will fail parsing in `local` or the UI.

**Model discovery & endpoints**:
- Local server exposes a discovery endpoint: GET `/models` (see `gdg-backend/local/index.js`) — useful for verifying which model IDs your API key can access.
- You can override which model is used by setting `GEMINI_MODEL` in the environment. If unset, the local server attempts to discover a compatible Gemini model.

**Model discovery & debugging**:
- GET `/models` returns a processed list of model names. For raw client output use `/models?raw=1` to retrieve the unmodified API response (helpful when model listing fails).
- The local server logs the raw `listModels` response to stdout. If model discovery fails, check the server console for the full payload and error messages.

**Frontend API configuration**:
- The frontend reads `API_BASE` from `gdg-frontend/config.js`. By default this uses `http://localhost:5000` for local development and `/api` for production hosting. You can override it by setting `window.__API_BASE__` in the hosting environment before loading scripts.

**Smoke test**:
- A lightweight smoke-test script was added at `gdg-backend/local/smoke-test.js`. Run it with:
```powershell
cd gdg-backend/local
node smoke-test.js
```
It will call `/models` and `/analyze` and print results.

**Conventions & gotchas**:
- Two module styles: Cloud functions use CommonJS (require/exports); local server uses ESM. Edit the matching file style when making changes.
- Node engine for functions is pinned to Node 24 in `functions/package.json` (`engines.node`): maintain compatibility when adding native APIs.
- Frontend expects certain risk token values and maps them: `MEDIUM`, `HIGH`, `HIGH RISK`, and `LOW`/`SAFE`. Normalize risk labels when changing model outputs.
- PDF upload handling: frontend strips the `data:...;base64,` prefix before sending `fileData` — do not send the prefix, and keep the size limit in mind (local server uses `express.json({ limit: '20mb' })`).

**Developer workflows / commands**:
- Run local Express test server (requires `GEMINI_API_KEY` in env or `.env` for `local`):
```powershell
cd gdg-backend/local
$env:GEMINI_API_KEY = "<your_key>"  # PowerShell example
node index.js
```
- Run Firebase functions emulator (to test cloud function locally):
```bash
cd gdg-backend/functions
npm run serve
# requires firebase-tools and project login
```
- Deploy functions:
```bash
cd gdg-backend/functions
npm run deploy
```
- Frontend: files are static (no build). Open `gdg-frontend/index.html` or host on any static server. The client uses CDN imports for Firebase.

**What to change where**:
- Quick fixes to prompt/response flow: prefer editing `gdg-backend/local/index.js` for iterative work (fast restart) and keep parity with `functions/index.js` prompts.
- If you change the response JSON shape, update `gdg-frontend/dashboard.js` to match how it accesses `data.summary`, `data.answer`, `data.actions`, and `data.risk`.

**Security / secrets**:
- Never commit `GEMINI_API_KEY` or other secrets. Local dev expects `.env` or environment variables.

If anything above is unclear or you'd like the instructions expanded (examples for prompt edits, test harnesses, or a CI step), tell me what to add and I'll iterate.
