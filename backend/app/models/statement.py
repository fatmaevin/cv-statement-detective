
import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, Integer, String,Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Statement(Base):
    __tablename__ = "statements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(Integer, nullable=True) 
    player_id = Column(UUID(as_uuid=True), ForeignKey("players.id"), nullable=True)
    statement = Column(Text, nullable=False)
    has_been_shown = Column(Boolean, default=False)
    score = Column(Integer, default=0)

    
    player = relationship("Player", backref="statements")