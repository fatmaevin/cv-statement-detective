from datetime import datetime
from sqlalchemy.orm import Session

from app.models.game import Game


# SERVICE FUNCTION TO CREATE A NEW GAME
def create_game(db: Session, host_name: str, host_id: int, passcode: str) -> Game:
    new_game = Game(
        host_name=host_name,
        host_id=host_id,
        passcode=passcode,
        game_link="",
        status="waiting",
        created_at=datetime.utcnow().isoformat(),
    )

    #
    db.add(new_game)
    db.commit()
    db.refresh(new_game)

    # Update the game_link with the generated game ID
    new_game.game_link = f"/games/{new_game.id}"
    db.commit()
    db.refresh(new_game)

    return new_game


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
