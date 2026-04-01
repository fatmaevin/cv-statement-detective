from fastapi import HTTPException
from app.models.game import Game
from app.models.statement import Statement
from app.config import ROUND_DURATION
from datetime import datetime, timedelta


def game_check(db, game_id: int):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


def statement_check(db, statement_id: int, game_id: int):
    # statement fetch
    statement = db.query(Statement).filter(Statement.id == statement_id).first()

    # check statement exists
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    # check statement belong to game
    if statement.game_id != game_id:
        raise HTTPException(
            status_code=400, detail="Statement does not belong to this game"
        )
    return statement

def is_round_expired(game: Game) -> bool:
    if not game.round_started_at:
        return False
    start_time = datetime.fromisoformat(game.round_started_at)
    now = datetime.utcnow()
    elapsed = now - start_time
    
    return elapsed > timedelta(seconds=ROUND_DURATION)       