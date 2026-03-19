from sqlalchemy import Column,Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(Integer,ForeignKey("games.id"), nullable=False)
    name = Column(String, nullable=False)

    game = relationship("Game", backref="players")
