# FoodOps – Food Business Operations Platform

One platform. Every outlet. Smarter operations.

React + Vite + Tailwind CSS + React Router + Lucide + Recharts. The frontend uses the FastAPI service in `../backend` for authentication, branches, menu items, orders, dashboard analytics and authorized user accounts.

## Run
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # production build

## Demo logins (password: `demo1234`)
admin@franchiseops.ai · owner@franchiseops.ai · manager@franchiseops.ai · staff@franchiseops.ai

## Data notes
- Attendance, shifts, inventory and employee designation/shift metadata are preview modules; edits are shared only for the current browser session and are not saved to the backend.
- Branch, menu, order and account data continue to use the existing API. Frontend navigation filters complement, but do not replace, backend authorization.
- Analytics uses saved branch, order and menu records when the API is available; attendance and inventory charts are explicitly marked as sample previews because those histories are not connected.
- Operational alerts combine saved outlet/order signals with preview-only attendance and inventory alerts. Dismissals and read state last only for the current browser session.
- The AI Business Assistant uses the existing rule-based, role-scoped `/assistant/ask` endpoint for supported saved-data questions. Attendance and inventory answers use labeled sample previews; this is not a generative AI integration.
- Food images use emoji placeholders; an image URL can be entered in the menu item editor.
