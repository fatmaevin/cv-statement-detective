import uuid
from sqlalchemy import Column,Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(Integer, nullable=True)
    name = Column(String, nullable=False)
