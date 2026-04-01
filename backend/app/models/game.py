from datetime import datetime
from sqlalchemy import Column, String, Integer
from app.database import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    host_name = Column(String, nullable=False)
    host_id = Column(Integer, nullable=False)
    passcode = Column(String, nullable=False)
    game_link = Column(String, default="", nullable=False)
    status = Column(String, default="waiting")
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat(), nullable=False)
    ended_at = Column(String, nullable=True)
    current_statement_id=Column(Integer,nullable=True)
    round_started_at = Column(String, nullable=True)
