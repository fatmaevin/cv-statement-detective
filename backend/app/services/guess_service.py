from app.services.utils import game_check
from app.models import Statement, Guess
from fastapi import HTTPException


def submit_guess(db, game_id: int, payload):
    # game validation
    game = game_check(db, game_id)

    # statement fetch
    statement = db.query(Statement).filter(Statement.id == payload.statement_id).first()

    # statement validation
    # check statement exists
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    # check statement belong to game
    if statement.game_id != game_id:
        raise HTTPException(
            status_code=400, detail="Statement does not belong to this game"
        )

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
