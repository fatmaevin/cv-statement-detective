from sqlalchemy import Column, String, Integer
from app.database import Base

class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    host_name = Column(String, nullable=False)
    host_id = Column(Integer, nullable=False)
    passcode = Column(String, nullable=False)
    game_link = Column(String, default="")
    status = Column(String, default="waiting") # waiting, in_progress, finished
    created_at = Column(String, nullable=False)