from app.database import SessionLocal
from app.models.game import Game
from datetime import datetime

def seed_game():
    db = SessionLocal()

   
    db.query(Game).delete()


    game = Game(
        host_name="Ali",
        host_id=1,
        passcode="1234",
        game_link="test-link",
        status="waiting",
        created_at=datetime.utcnow()
    )

    db.add(game)
    db.commit()
    db.refresh(game)

    print("Game created with id:", game.id)

    db.close()

if __name__ == "__main__":
    seed_game()