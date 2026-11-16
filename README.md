# FranchiseOps AI – Module 1 (Frontend only)

React + Vite + Tailwind CSS + React Router + Lucide + Recharts. No backend, no database, no APIs.

## Run
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # production build

## Demo logins (any 6+ char password; pick a role on the login page)
admin@franchiseops.ai · owner@franchiseops.ai · manager@franchiseops.ai · staff@franchiseops.ai

## Notes
- Role simulation is UI-only (src/data/roles.js) — not real security.
- All data lives in memory (src/context/DataContext.jsx); refresh resets it.
- Food images use emoji placeholders; paste an image URL in the Add/Edit item modal to use a photo.
- To integrate backend/AI later, replace the helpers in DataContext with API calls.
