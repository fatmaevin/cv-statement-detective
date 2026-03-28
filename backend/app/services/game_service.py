from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.game import Game

# SERVICE FUNCTION TO CREATE A NEW GAME
from datetime import datetime
from sqlalchemy.orm import Session
import random

from app.models.game import Game
from app.services.statement_service import get_next_statement
from app.services.guess_service import is_round_complete


def create_game(db: Session, host_name: str, passcode: str) -> Game:
    try:
        host_id = random.randint(1000, 9999)
        new_game = Game(
            host_name=host_name,
            host_id=host_id,
            passcode=passcode,
            created_at=datetime.utcnow().isoformat(),
        )

        db.add(new_game)
        db.commit()
        db.refresh(new_game)

        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        new_game.game_link = f"http://localhost:5173/pages/join-game?host_id={host_id}&game_id={new_game.id}&passcode={passcode}&{timestamp}"

        db.commit()
        db.refresh(new_game)

        return new_game

    except Exception:
        db.rollback()
        raise


# SERVICE FUNCTION TO START A GAME
def start_game(db: Session, game_id: int) -> Game | None:
    game = db.query(Game).filter(Game.id == game_id).first()

    if not game:
        return None

    if game.status == "in_progress":
        # If game is already running, ensure it still has a valid active statement
        if game.current_statement_id is None:
            first_statement = get_next_statement(db, game_id)
            if not first_statement:
                raise HTTPException(status_code=400, detail="No statements available")
            game.current_statement_id = first_statement.id
            db.commit()
            db.refresh(game)
        return game

    game.status = "in_progress"

    first_statement = get_next_statement(db, game_id)

    if not first_statement:
        raise HTTPException(status_code=400, detail="No statements available")

    # Initialize first round
    game.current_statement_id = first_statement.id

    db.commit()
    db.refresh(game)

    return game


# SERVICE FUNCTION TO finish A GAME


def finish_game(db: Session, game_id: int) -> Game | None:
    game = db.query(Game).filter(Game.id == game_id).first()

    if not game:
        return None

    game.status = "finished"
    game.ended_at = datetime.utcnow().isoformat()

    db.commit()
    db.refresh(game)
    return game


# -------------------------------------
# GAME FLOW ADVANCER (CRITICAL SECTION)
# -------------------------------------
def advance_game_if_ready(db: Session, game_id: int, statement_id: int):

    # Step 1: Check if all players finished current round
    if not is_round_complete(db, game_id, statement_id):
        return None

    # Step 2: Lock game row to prevent race conditions (multi-client safety)
    game = db.query(Game).filter(Game.id == game_id).with_for_update().first()

    # 3. prevent double execution (race safety)
    if game.current_statement_id != statement_id:
        return None

    # 4. get next statement
    next_statement = get_next_statement(db, game_id)

    # 5. if no statements left → finish game
    if not next_statement:
        game.status = "finished"
        game.current_statement_id = None
        game.ended_at = datetime.utcnow()
        db.commit()
        return {"status": "finished"}

    # 6. move game forward
    game.current_statement_id = next_statement.id

    db.commit()
    db.refresh(game)

    return {"status": "next_round", "statement_id": next_statement.id}
