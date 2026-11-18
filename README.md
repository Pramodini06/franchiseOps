# FranchiseOps AI — Module 1

## Run locally

Open two terminals from the project folder.

Backend (Python 3.10+):

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn main:app --reload --app-dir backend
```

API docs: http://127.0.0.1:8000/docs

Frontend:

```powershell
cd frontend
npm run dev
```

The Vite development server proxies `/api` to the backend. SQLite is created automatically at `backend/franchiseops.db` and seeded with the project's original branches, menu items, users, and sample orders on first run.

Seeded demo accounts all use password `demo1234`:

- `admin@franchiseops.ai`
- `owner@franchiseops.ai`
- `manager@franchiseops.ai`
- `staff@franchiseops.ai`

Changing the database path: set `FRANCHISE_DB_PATH` before starting Uvicorn. This local SQLite setup implements the existing Module 1 data; the project roadmap's recommended MySQL deployment can be introduced later without changing the React screens.
