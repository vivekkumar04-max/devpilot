# DevPilot Starter

A starter monorepo for DevPilot: a repository setup planner with a manually managed checklist. It does **not** automatically inspect your machine or execute terminal commands yet.

## Stack
- Main dashboard: React + Vite + Tailwind CSS
- Vue companion prototype: Vue 3 + Vite + Tailwind CSS (separate app)
- API: Node.js + Express
- Database/auth: MongoDB + Mongoose + bcrypt + JWT
- AI: Google Gemini API integration for repository setup checklists

## Requirements
- Node.js 20+ recommended
- MongoDB local instance or MongoDB Atlas URI
- Gemini API key (optional; the demo checklist works without it)

## 1. Configure backend
```bash
cd server
cp .env.example .env
```
Edit `server/.env` and add your own `MONGODB_URI`, `JWT_SECRET`, and optionally `GEMINI_API_KEY` and `GEMINI_MODEL`. Never commit `.env` or share your keys.

## 2. Install and run the API
```bash
cd server
npm install
npm run dev
```
API default: http://localhost:5000

## 3. Run the React dashboard
Open another terminal:
```bash
cd client-react
npm install
npm run dev
```
Vite usually opens http://localhost:5173. The React dashboard calls the API at `http://localhost:5000/api`.

## 4. Optional Vue checklist prototype
In another terminal:
```bash
cd client-vue
npm install
npm run dev
```
Vite uses another available port if 5173 is taken. This is a separate Vue 3 prototype demonstrating the same manual checklist idea; it is not mounted inside the React app.

## Included in this starter
- Register/login with MongoDB-backed users
- JWT-protected setup-plan endpoint
- Public GitHub repository metadata lookup
- Gemini-generated setup checklist, with a safe demo fallback
- Manual checklist toggles saved in browser localStorage
- Editable profile name and image
- Account-specific recent repository history saved in MongoDB (up to 20 entries)
- Clear placeholder for the future local agent

## Not implemented yet
- Automatic detection of installed tools or completed steps
- Local agent, VS Code extension, or terminal execution
- Reliable automated diagnosis of local machine errors
- Arbitrary repository execution (intentionally excluded for safety)

## Important notes
- A normal website cannot inspect or run commands on your computer. That requires a local agent or editor extension, which can be added later with explicit user approval and strong safety controls.
- Treat repository contents and generated instructions as untrusted. Review commands before running them.
- If Gemini is unavailable or no Gemini API key is configured, the API returns a deterministic starter checklist.
- Do not put API keys in frontend environment variables. Keep secrets in `server/.env` only.
