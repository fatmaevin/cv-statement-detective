from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session


from app.database import SessionLocal
from app.services.game_service import create_game, start_game
from app.services.player_service import join_game, get_players
from app.services.statement_service import get_statements, get_results
from app.services.guess_service import submit_guess
from app.schemas import JoinGameRequest, SubmitGuessRequest
from fastapi.middleware.cors import CORSMiddleware

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


# PYDANTIC MODEL FOR GAME CREATION REQUEST, THIS DEFINES THE EXPECTED STRUCTURE OF THE REQUEST BODY FOR CREATING A NEW GAME
class GameCreateRequest(BaseModel):
    host_name: str
    host_id: int
    passcode: str


# ENDPOINT TO CREATE A NEW GAME
@app.post("/games")
def create_game_endpoint(payload: GameCreateRequest, db: Session = Depends(get_db)):
    game = create_game(
        db=db,
        host_name=payload.host_name,
        host_id=payload.host_id,
        passcode=payload.passcode,
    )

    return {
        "game_id": game.id,
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


# ENDPOINT FOR PLAYERS
@app.post("/games/{game_id}/players")
def join_game_endpoint(
    payload: JoinGameRequest, game_id: int, db: Session = Depends(get_db)
):

    player = join_game(
        db=db, name=payload.name, game_id=game_id, statement=payload.statement
    )

    return {"player_id": player.id, "game_id": player.game_id, "name": player.name}


@app.get("/games/{game_id}/players")
def get_players_endpoint(game_id: int, db: Session = Depends(get_db)):
    return get_players(db=db, game_id=game_id)


# ENDPOINT FOR STATEMENTS


@app.get("/games/{game_id}/current-statement")
def get_statement_endpoint(game_id: int, db: Session = Depends(get_db)):
    statement = get_statements(db=db, game_id=game_id)
    return {"statement_id": statement.id, "statement": statement.statement}


@app.get("/games/{game_id}/results")
def get_results_endpoint(game_id: int, db: Session = Depends(get_db)):
    return get_results(db=db, game_id=game_id)


@app.post("/games/{game_id}/guesses")
def submit_guess_endpoint(
    game_id: int, payload: SubmitGuessRequest, db: Session = Depends(get_db)
):
    result = submit_guess(db=db, game_id=game_id, payload=payload)
    return result
