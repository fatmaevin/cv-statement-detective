from sqlalchemy import Column, Integer, String
from .database import Base

class Players(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, ForeignKey("games.id"), index=True, nullable=False)
    name = Column(String, index=True, nullable=False)