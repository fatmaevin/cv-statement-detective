from sqlalchemy.orm import Session
from fastapi import HTTPException
import random

from app.models import Statement
from app.services.utils import game_check


def get_statements(db: Session, game_id: int):
    game = game_check(db, game_id)

    statements = (
        db.query(Statement)
        .filter(Statement.game_id == game_id, Statement.has_been_shown == False)
        .all()
    )
    if not statements:
        raise HTTPException(status_code=404, detail="No more statements")

    select_statement = random.choice(statements)
    select_statement.has_been_shown = True

    db.commit()
    db.refresh(select_statement)

    return select_statement


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
    return statements
