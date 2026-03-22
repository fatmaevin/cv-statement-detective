from fastapi import HTTPException
from app.models.game import Game


def game_check(db, game_id: int):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game
