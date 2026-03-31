from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session


from app.database import SessionLocal
from app.services.game_service import (
    create_game,
    start_game,
    finish_game,
    advance_game_if_ready,
)
from app.services.player_service import join_game, get_players
from app.services.statement_service import get_results, get_current_statement
from app.services.guess_service import submit_guess, get_guess_status, get_game_status
from app.schemas import JoinGameRequest, GameCreateRequest, SubmitGuessRequest
from fastapi.middleware.cors import CORSMiddleware
from app.models.game import Game

app = FastAPI()

# CORS configuration to allow requests from the frontend (running on localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "Hello World"}


# ENDPOINT TO CREATE A NEW GAME
@app.post("/games")
def create_game_endpoint(payload: GameCreateRequest, db: Session = Depends(get_db)):
    game = create_game(
        db=db,
        host_name=payload.host_name,
        passcode=payload.passcode,
    )

    return {
        "game_id": game.id,
        "host_id": game.host_id,
        "status": game.status,
        "game_link": game.game_link,
        "passcode": game.passcode,
    }


# ENDPOINT TO START A GAME
@app.post("/games/{game_id}/start")
def start_game_endpoint(game_id: int, db: Session = Depends(get_db)):
    game = start_game(db=db, game_id=game_id)

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    return {
        "game_id": game.id,
        "status": game.status,
        "message": "Game started successfully",
    }

# ENDPOINT TO GET GAME STATUS
@app.get("/games/{game_id}")
def get_game_endpoint(game_id: int, db: Session = Depends(get_db)):
    game = db.query(game).filter(game.id == game_id).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    return {
        "game_id": game.id,
        "status": game.status,
    }


# ENDPOINT FOR PLAYERS
@app.post("/games/{game_id}/players")
def join_game_endpoint(
    payload: JoinGameRequest, game_id: int, db: Session = Depends(get_db)
):

    player = join_game(
        db=db,
        name=payload.name,
        game_id=game_id,
        statement=payload.statement,
        passcode=payload.passcode,
    )

    return {"player_id": player.id, "game_id": player.game_id, "name": player.name}


@app.get("/games/{game_id}/players")
def get_players_endpoint(game_id: int, db: Session = Depends(get_db)):
    return get_players(db=db, game_id=game_id)


# ENDPOINT FOR STATEMENTS
# ---------------------------
# CURRENT GAME STATE (CORE FRONTEND POLLING SOURCE)
# ---------------------------
@app.get("/games/{game_id}/current-statement")
def get_statement_endpoint(game_id: int, db: Session = Depends(get_db)):

    statement = get_current_statement(db, game_id)

    return {"statement_id": statement.id, "statement": statement.statement}


@app.get("/games/{game_id}/results")
def get_results_endpoint(game_id: int, db: Session = Depends(get_db)):
    return get_results(db=db, game_id=game_id)


# ---------------------------
# GUESS SUBMISSION + GAME ENGINE TRIGGER
# ---------------------------
@app.post("/games/{game_id}/guesses")
def submit_guess_endpoint(
    game_id: int, payload: SubmitGuessRequest, db: Session = Depends(get_db)
):

    guess = submit_guess(db, game_id, payload)

    # Immediately trigger game progression logic after each submission
    # This is the core "game engine hook"
    engine_result = advance_game_if_ready(
        db=db, game_id=game_id, statement_id=payload.statement_id
    )

    return {"guess": guess, "engine": engine_result}


# ENDPOINT FOR GET GUESS STATUS
# ---------------------------
# POLLING STATUS (FRONTEND SYNC)
# ---------------------------


@app.get("/games/{game_id}/guesses/status")
def check_guesses_endpoint(
    game_id: int, statement_id: int, db: Session = Depends(get_db)
):
    result = get_guess_status(db=db, game_id=game_id, statement_id=statement_id)
    return result


# ---------------------------
# GAME TERMINATION (MANUAL)
# ---------------------------


@app.patch("/games/{game_id}/finish")
def finish_game_endpoint(game_id: int, db: Session = Depends(get_db)):
    result = finish_game(db=db, game_id=game_id)
    return result


@app.get("/debug/game-status/{game_id}")
def debug_game_status(game_id: int, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    return {
        "game_id": game.id,
        "status": game.status,
        "is_game_completed": game.status == "finished"
    }