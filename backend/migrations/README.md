Migration workflow (Flask-Migrate)

1. Install dependencies:
   pip install -r requirements.txt

2. Set Flask app:
   export FLASK_APP=manage:app

3. Initialize migrations folder (one-time):
   flask db init

4. Create a migration:
   flask db migrate -m "initial schema"

5. Apply migration:
   flask db upgrade

6. Seed data:
   flask seed

Notes:
- In this repository, `manage.py` exposes the app instance for CLI usage.
- Docker workflow can run the same commands inside the `api` container.
