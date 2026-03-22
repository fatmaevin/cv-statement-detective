from app.services.utils import game_check,statement_check
from app.models import  Guess
from fastapi import HTTPException
from app.services.player_service import get_players


def submit_guess(db, game_id: int, payload):
    # game validation
    game = game_check(db, game_id)
    
    # statement validation
    statement=statement_check(db,payload.statement_id,game_id)
    
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

    return {"message": "Guess submitted successfully", "guess_id": new_guess.id}


def get_guess_status(db,game_id: int,statement_id: int):

    # game validation
    game = game_check(db, game_id)
    
    # statement validation
    statement=statement_check(db,statement_id,game_id)

    players= get_players(db=db,game_id=game_id)
    guesses=db.query(Guess).filter(Guess.game_id==game_id , Guess.statement_id==statement_id).all()
    submitted_guesses=len(guesses)
    total_players=len(players)
    pending_guesses=max(total_players-submitted_guesses,0)
    is_complete= submitted_guesses==total_players

    return {
        "game_id":game_id,
        "statement_id":statement_id,
        "total_players":total_players,
        "submitted_guesses":submitted_guesses,
        "pending_guesses":pending_guesses,
        "is_complete":is_complete

    } 