from sqlalchemy.orm import Session
from fastapi import HTTPException
import random
from datetime import datetime

from app.models import Statement, Game
from app.services.utils import game_check


def get_current_statement(db: Session, game_id: int):

    game = db.query(Game).filter(Game.id == game_id).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # initialize first statement if needed
    if game.current_statement_id is None:
        statement = get_next_statement(db, game_id)

        if not statement:
            raise HTTPException(status_code=404, detail="No statements left")

        game.current_statement_id = statement.id
        game.round_started_at = datetime.utcnow().isoformat()
        db.commit()
        db.refresh(game)

    # always return current
    statement = (
        db.query(Statement).filter(Statement.id == game.current_statement_id).first()
    )

    return statement


def get_results(db: Session, game_id: int):
    game = game_check(db, game_id)

    statements = (
        db.query(Statement)
        .filter(Statement.game_id == game_id)
        .order_by(Statement.score.desc())
        .all()
    )
    if not statements:
        raise HTTPException(status_code=404, detail="No result found")

    result = []

    for s in statements:
        result.append(
            {
                "statement_id": s.id,
                "statement": s.statement,
                "score": s.score,
                "owner_name":s.player.name
            }
        )

    return result


def get_next_statement(db: Session, game_id: int):

    statements = (
        db.query(Statement)
        .filter(Statement.game_id == game_id, Statement.has_been_shown == False)
        .all()
    )

    if not statements:
        return None

    selected = random.choice(statements)
    selected.has_been_shown = True

    db.commit()
    db.refresh(selected)

    return selected
