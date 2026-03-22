from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.services.utils import game_check

from app.models import Player, Statement


def join_game(db: Session, game_id: int, name: str,statement:str):
    game = game_check(db, game_id)
    player = Player(game_id=game_id, name=name)

    db.add(player)
    db.commit()
    db.refresh(player)

    new_statement = Statement(
        game_id=game_id, player_id=player.id, statement=statement, has_been_shown=False
    )
    db.add(new_statement)
    db.commit()
    db.refresh(new_statement)

    return player


def get_player(db: Session, game_id: int, player_id: int):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    if player.game_id != game_id:
        raise HTTPException(status_code=400, detail="Player does not belong this game")
    return player
