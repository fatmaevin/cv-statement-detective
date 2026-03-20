from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services.game_service import create_game, start_game


app = FastAPI()


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
        passcode=payload.passcode
    )

    return {
        "game_id": game.id,
        "status": game.status,
        "game_link": game.game_link,
        "passcode": game.passcode
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
        "message": "Game started successfully"
    }