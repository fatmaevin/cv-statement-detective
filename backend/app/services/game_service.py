from datetime import datetime
from sqlalchemy.orm import Session

from app.models.game import Game


# SERVICE FUNCTION TO CREATE A NEW GAME
from datetime import datetime
from sqlalchemy.orm import Session
import random

from app.models.game import Game




def create_game(db: Session, host_name: str, passcode: str) -> Game:
    try:
        host_id = random.randint(1000, 9999)
        new_game = Game(
            host_name=host_name,
            host_id=host_id,
            passcode=passcode,
            created_at=datetime.utcnow().isoformat()
        )

        db.add(new_game)
        db.commit()
        db.refresh(new_game)

        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        new_game.game_link = f"/games/{host_id}-{passcode}-{timestamp}"

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

    if (
        game.status == "in_progress"
    ):  # If the game is already in progress, we can just return it without changing the status
        return game

    game.status = "in_progress"
    db.commit()
    db.refresh(game)

    return game

# SERVICE FUNCTION TO finish A GAME
def finish_game(db:Session,game_id:int)->Game | None:
  game=db.query(Game).filter(Game.id==game_id).first()

  if not game:
      return None
  
  game.status="finished"
  game.ended_at=datetime.utcnow().isoformat()

  db.commit()
  db.refresh(game)
  return game