from app.database import SessionLocal

from app.models.game import Game
from app.models.player import Player
from app.models.statement import Statement
from app.models.guess import Guess

from scripts.seed_game import seed_game
from scripts.seed_players import seed_players
from scripts.seed_statements import seed_statements
from scripts.seed_guesses import seed_guesses


def reset_db():
    db = SessionLocal()

    db.query(Guess).delete()
    db.query(Statement).delete()
    db.query(Player).delete()
    db.query(Game).delete()

    db.commit()
    db.close()


def run_all():
    print("🚀 Starting full database seed...")

    reset_db()
    print("🧹 Database reset done")

    seed_game()
    print("✔ Game seeded")

    seed_players()
    print("✔ Players seeded")

    seed_statements()
    print("✔ Statements seeded")

    seed_guesses()
    print("✔ Guesses seeded")

    print("🎉 All seeds completed successfully!")


if __name__ == "__main__":
    run_all()