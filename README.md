# Farm-Task

Farm management and watering tracker application.

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + SQLAlchemy 2.0 (async) + aiosqlite
- **Database**: SQLite (dev) / PostgreSQL (production)
- **PWA**: vite-plugin-pwa for offline support

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database Migrations

```bash
cd backend
alembic upgrade head
```
