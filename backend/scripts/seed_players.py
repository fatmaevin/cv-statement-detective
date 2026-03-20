from app.database import SessionLocal
from app.models.player import Player
from app.models.game import Game

def seed_players():
    db = SessionLocal()

    game = db.query(Game).order_by(Game.id.desc()).first()

    players = [
        Player(name="Sheida", game_id=game.id),
        Player(name="Fred", game_id=game.id),
        Player(name="Fatma", game_id=game.id),
        Player(name="Jesus", game_id=game.id),
    ]

    db.add_all(players)
    db.commit()

    print(f"{len(players)} players created for game {game.id}")

    db.close()

if __name__ == "__main__":
    seed_players()