import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:" # create a temporary database in ram for testing

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine) # take all models and create in temporary database
    db = TestingSessionLocal()
    yield db
    db.close()
