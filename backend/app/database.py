import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()
# 1. Read the database URL from the environment variable
DATABASE_URL = os.getenv("DATABASE_URL")
# 2. Create the engine to connect to the database
engine = create_engine(DATABASE_URL, echo=True)  # echo=True logs all SQL queries
# 3. Create SessionLocal for creating database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# 4. Base class for defining SQLAlchemy models
Base = declarative_base()


# Dependency for getting a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
