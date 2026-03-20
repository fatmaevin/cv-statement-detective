import random
from app.database import SessionLocal
from app.models.game import Game
from app.models.player import Player
from app.models.statement import Statement
from app.models.guess import Guess

def seed_guesses():
    db = SessionLocal()

    game = db.query(Game).order_by(Game.id.desc()).first()

    players = db.query(Player).filter(Player.game_id == game.id).all()
    statements = db.query(Statement).filter(Statement.game_id == game.id).all()

    guesses = []

    for statement in statements:
        for player in players:

            
            possible = [p for p in players if p.id != player.id]

            guessed = random.choice(possible)

            guess = Guess(
                game_id=game.id,
                statement_id=statement.id,
                player_id=player.id,
                guessed_player_id=guessed.id
            )

            guesses.append(guess)

    db.add_all(guesses)
    db.commit()

    print(f"{len(guesses)} guesses created for game {game.id}")

    db.close()


if __name__ == "__main__":
    seed_guesses()