# Joint Holbies AI Backend (Flask + MySQL)

## Stack
- Flask
- SQLAlchemy + Flask-Migrate
- JWT auth
- MySQL (Docker Compose)

## Local Run
1. Create environment and install deps:
   - `python3 -m venv .venv`
   - `. .venv/bin/activate`
   - `pip install -r requirements.txt`
2. Set env:
   - `cp .env.example .env`
3. Run API:
   - `python run.py`

## Docker Run
1. From `backend/`:
   - `cp .env.example .env`
   - `docker compose up --build`
2. API health:
   - `GET http://localhost:5000/api/health`

## Database Migration + Seed
- `export FLASK_APP=manage:app`
- `flask db init` (first time only)
- `flask db migrate -m "initial schema"`
- `flask db upgrade`
- `flask seed`

## Auth Demo Credentials
- Student: `student@teamforge.az` / `password`
- Admin: `admin@teamforge.az` / `password`

## Tests
- Install test deps:
  - `pip install -r requirements.txt`
- Run:
  - `python3 -m pytest tests -q`

