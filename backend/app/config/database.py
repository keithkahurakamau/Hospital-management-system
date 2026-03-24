import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Initialize environment variables
load_dotenv()

# --- DATABASE CONFIGURATION ---
# Fetching variables from .env with default fallbacks for local dev safety
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "medicare_db")

# Construct the standard PostgreSQL connection URI
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# --- SQLALCHEMY ENGINE & SESSION ---
# The engine is the "pipeline" to the database
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # pool_pre_ping=True helps maintain stable connections in high-concurrency ERP environments
    pool_pre_ping=True 
)

# Each instance of SessionLocal will be a database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our database models to inherit from
Base = declarative_base()

# --- DEPENDENCY INJECTION ---
def get_db():
    """
    Creates a new database session for each request, 
    ensuring the connection is closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()