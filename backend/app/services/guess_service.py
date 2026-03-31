from app.services.utils import game_check, statement_check
from app.models import Guess, Statement, Player
from fastapi import HTTPException
from app.services.player_service import get_players


def submit_guess(db, game_id: int, payload):
    # game validation
    game = game_check(db, game_id)

    # statement validation
    statement = statement_check(db, payload.statement_id, game_id)

    # duplicate guess check
    existing_guess = (
        db.query(Guess)
        .filter(
            Guess.game_id == game_id,
            Guess.statement_id == payload.statement_id,
            Guess.player_id == payload.player_id,
        )
        .first()
    )
    if existing_guess:
        raise HTTPException(
            status_code=400,
            detail="You have already submitted a guess for this statement",
        )

    # save guess in guesses table
    new_guess = Guess(
        game_id=game_id,
        statement_id=payload.statement_id,
        player_id=payload.player_id,
        guessed_player_id=payload.guessed_player_id,
    )
    db.add(new_guess)
    db.commit()
    db.refresh(new_guess)

    update_statement_score(db, statement, payload.guessed_player_id)

    return {"message": "Guess submitted successfully", "guess_id": new_guess.id}


def get_guess_status(db, game_id: int, statement_id: int):
    # game validation
    game = game_check(db, game_id)

    # statement validation
    statement = statement_check(db, statement_id, game_id)

    players = get_players(db=db, game_id=game_id)
    guesses = (
        db.query(Guess)
        .filter(Guess.game_id == game_id, Guess.statement_id == statement_id)
        .all()
    )

    submitted_guesses = len(guesses)
    total_players = len(players)

    # Derived sync state for frontend polling
    pending_guesses = max(total_players - submitted_guesses, 0)
    is_complete = submitted_guesses == total_players

    return {
        "game_id": game_id,
        "statement_id": statement_id,
        # Important for frontend sync (current active round pointer)
        "current_statement_id": game.current_statement_id,
        "total_players": total_players,
        "submitted_guesses": submitted_guesses,
        "pending_guesses": pending_guesses,
        # Core flag used by polling system to trigger next round
        "is_complete": is_complete,
        "game_status": game.status,
    }


def get_game_status(db, game_id: int):
    statements = db.query(Statement).filter(Statement.game_id == game_id).all()
    if not statements:
        return {
            "game_id": game_id,
            "total_statements": 0,
            "all_statements_shown": False,
            "all_statements_completed": False,
            "is_game_completed": False,
        }

    # Check if every statement has been shown at least once
    all_statements_shown = True
    for s in statements:
        if not s.has_been_shown:
            all_statements_shown = False
            break

    # Check if every statement has been fully resolved by all players
    all_statements_completed = True
    for s in statements:
        status = get_guess_status(db, game_id, s.id)

        if not status["is_complete"]:
            all_statements_completed = False
            break

    # Final game completion condition (both visibility + completion)
    game_is_completed = all_statements_shown and all_statements_completed

    return {
        "game_id": game_id,
        "total_statements": len(statements),
        "all_statements_shown": all_statements_shown,
        "all_statements_completed": all_statements_completed,
        "is_game_completed": game_is_completed,
    }


def is_round_complete(db, game_id: int, statement_id: int) -> bool:

    # Lightweight check used for quick round completion validation
    total_players = db.query(Player).filter(Player.game_id == game_id).count()

    guesses_count = (
        db.query(Guess)
        .filter(Guess.game_id == game_id, Guess.statement_id == statement_id)
        .count()
    )

    return guesses_count >= total_players


def update_statement_score(db, statement, guessed_player_id: int):
    if guessed_player_id == statement.player_id:
        statement.score += 1
        db.commit()
        db.refresh(statement)
