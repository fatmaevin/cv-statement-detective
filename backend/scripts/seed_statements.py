from app.database import SessionLocal
from app.models.game import Game
from app.models.player import Player
from app.models.statement import Statement

def seed_statements():
    db = SessionLocal()

   
    game = db.query(Game).order_by(Game.id.desc()).first()

   
    players = db.query(Player).filter(Player.game_id == game.id).all()

    sample_statements = [
        "I have never traveled outside my country",
        "I can play a musical instrument",
        "I once met a celebrity",
        "I hate coffee",
        "I can speak 3 languages",
    ]

    statements = []

    for i, player in enumerate(players):
        stmt = Statement(
            game_id=game.id,
            player_id=player.id,
            statement=sample_statements[i % len(sample_statements)],
            has_been_shown=False,
            score=0
        )
        statements.append(stmt)

    db.add_all(statements)
    db.commit()

    print(f"{len(statements)} statements created for game {game.id}")

    db.close()


if __name__ == "__main__":
    seed_statements()