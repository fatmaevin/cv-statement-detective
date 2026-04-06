from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.game import Game

# SERVICE FUNCTION TO CREATE A NEW GAME
from datetime import datetime
import random

from app.models.game import Game
from app.services.statement_service import get_next_statement
from app.services.guess_service import is_round_complete
from app.services.utils import is_round_expired


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
        new_game.game_link = f"https://cv-statement-detective.hosting.codeyourfuture.io/pages/join-game?host_id={host_id}&game_id={new_game.id}&passcode={passcode}&{timestamp}"

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
            game.round_started_at = datetime.utcnow().isoformat()
            db.commit()
            db.refresh(game)
        return game

    game.status = "in_progress"

    first_statement = get_next_statement(db, game_id)

    if not first_statement:
        raise HTTPException(status_code=400, detail="No statements available")

    # Initialize first round
    game.current_statement_id = first_statement.id
    game.round_started_at = datetime.utcnow().isoformat()

    db.commit()
    db.refresh(game)

    return game


# SERVICE FUNCTION TO finish A GAME


def finish_game(db: Session, game_id: int, host_forced: bool = False) -> dict | None:
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        return None

    game.status = "finished"
    game.ended_at = datetime.utcnow()
    game.host_forced_finish = host_forced 

    db.commit()
    db.refresh(game)

    return {
        "game": game,
        "host_forced_finish": host_forced
    }

# -------------------------------------
# GAME FLOW ADVANCER (CRITICAL SECTION)
# -------------------------------------
def advance_game_if_ready(db: Session, game_id: int):

    # ------------------------------------------------------------
    # STEP 1: Load current game state (NO LOCK YET)
    # ------------------------------------------------------------
    # We first fetch the game in a lightweight query because:
    # - Most requests will NOT result in a round change
    # - We avoid unnecessary row locking (performance optimization)
    # - We need current_statement_id to evaluate round state

    game = db.query(Game).filter(Game.id == game_id).first()

    # Safety check:
    # If game doesn't exist OR no active statement,
    # there is nothing to advance.
    if not game or not game.current_statement_id:
        return None

    current_statement_id = game.current_statement_id

    # ------------------------------------------------------------
    # STEP 2: Decide if round should advance
    # ------------------------------------------------------------
    # A round should advance ONLY if ONE of these is true:
    # 1. All players have submitted guesses (round complete)
    # 2. Time limit for the round has expired
    #
    # If neither condition is met, we exit early to avoid:
    # - premature round switching
    # - inconsistent game state between players
    if not (
        is_round_complete(db, game_id, current_statement_id)
        or is_round_expired(game)
    ):
        return None

    # ------------------------------------------------------------
    # STEP 3: Acquire row lock (race condition protection)
    # ------------------------------------------------------------
    # At this point, multiple clients (submit + polling) may try
    # to advance the game simultaneously.
    #
    # with_for_update() ensures:
    # - Only one transaction can modify this game row at a time
    # - Prevents double advancement of the same round
    game = db.query(Game).filter(Game.id == game_id).with_for_update().first()

    # Safety re-check after lock:
    # Game state might have changed between STEP 1 and now.
    # If no active statement exists anymore, stop execution.
    if not game.current_statement_id:
        return None

    # ------------------------------------------------------------
    # STEP 4: Fetch next statement
    # ------------------------------------------------------------
    # This determines what the next round should display.
    # If None is returned, it means we reached the end of the game.
    next_statement = get_next_statement(db, game_id)

    # ------------------------------------------------------------
    # STEP 5: End game if no more statements exist
    # ------------------------------------------------------------
    # This is the terminal state of the game lifecycle.
    # We explicitly:
    # - mark game as finished
    # - clear current statement
    # - set timestamps for audit/history
    if not next_statement:
        game.status = "finished"
        game.current_statement_id = None
        game.round_started_at = None
        game.ended_at = datetime.utcnow()
        db.commit()
        return {"status": "finished"}

    # ------------------------------------------------------------
    # STEP 6: Advance to next round
    # ------------------------------------------------------------
    # We move game state forward:
    # - update active statement
    # - reset round timer
    #
    # This ensures all clients will see the same new state
    # on next polling cycle.
    game.current_statement_id = next_statement.id
    game.round_started_at = datetime.utcnow().isoformat()

    db.commit()
    db.refresh(game)

    return {"status": "next_round", "statement_id": next_statement.id}