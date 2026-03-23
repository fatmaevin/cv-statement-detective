from sqlalchemy import Column, UniqueConstraint, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.database import Base


class Guess(Base):
    __tablename__ = "guesses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    statement_id = Column(Integer, ForeignKey("statements.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    guessed_player_id = Column(Integer, ForeignKey("players.id"), nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "game_id",
            "statement_id",
            "player_id",
            name="uq_one_vote_per_player_per_statement",
        ),
    )

    player = relationship("Player", foreign_keys=[player_id])
    guessed_player = relationship("Player", foreign_keys=[guessed_player_id])
    statement = relationship("Statement", backref="guesses")
    game = relationship("Game")
