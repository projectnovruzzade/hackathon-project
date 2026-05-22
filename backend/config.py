import os
from pathlib import Path


def _build_database_url() -> str:
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        return env_url

    use_sqlite = os.getenv("USE_SQLITE", "").strip().lower() in {"1", "true", "yes"}
    if use_sqlite:
        return f"sqlite:///{(Path(__file__).resolve().parent / 'local.db').as_posix()}"

    user = os.getenv("MYSQL_USER")
    password = os.getenv("MYSQL_PASSWORD")
    database = os.getenv("MYSQL_DATABASE")
    if user and password and database:
        host = os.getenv("MYSQL_HOST", "127.0.0.1")
        port = os.getenv("MYSQL_PORT", "3306")
        return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}"

    return f"sqlite:///{(Path(__file__).resolve().parent / 'local.db').as_posix()}"


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-key")
    SQLALCHEMY_DATABASE_URI = _build_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    CV_UPLOAD_DIR = os.getenv(
        "CV_UPLOAD_DIR",
        str((Path(__file__).resolve().parent / "uploads" / "cv").resolve()),
    )

