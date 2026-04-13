from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.services.utils import game_check

from app.models import Player, Statement


def join_game(db: Session, game_id: int, name: str, statement: str,passcode:str=None):
    game = game_check(db, game_id)
    if game.passcode:
        if not passcode:
            raise HTTPException(status_code=400, detail="Game has a passcode please enter passcode")
        if game.passcode !=passcode:
            raise HTTPException(status_code=403, detail="Incorrect passcode")
        
    # CHECK DUPLICATE NAME (ADD THIS)
    existing_player = db.query(Player).filter(
        Player.game_id == game_id,
        Player.name.ilike(name)  # case-insensitive check
    ).first()

    if existing_player:
        raise HTTPException(
            status_code=400,
            detail="This name is already taken in this game."
        )
    
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


def get_players(db: Session, game_id: int):
    players = db.query(Player).filter(Player.game_id == game_id).all()

    result = []
    for p in players:
        result.append({"player_id": p.id, "name": p.name})

    return result
