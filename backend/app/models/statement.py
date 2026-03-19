from sqlalchemy import Column, Integer,Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Statement(Base):
    __tablename__ = "statements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(Integer,ForeignKey("games.id"), nullable=False)  
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    statement = Column(Text, nullable=False)
    has_been_shown = Column(Boolean, default=False)
    score = Column(Integer, default=0)

    
    player = relationship("Player", backref="statements")
    game = relationship("Game", backref="statements")