from datetime import datetime, timedelta, UTC

from app.database import SessionLocal
from app.models import Game, Player, Statement, Guess


def cleanup_old_games():
    db = SessionLocal()

    try:
        # 24h cutoff (timezone-safe)
        cutoff_time = (datetime.now(UTC) - timedelta(hours=24)).isoformat()

        # get old games
        old_games = db.query(Game).filter(Game.created_at < cutoff_time).all()

        print(f"Deleting {len(old_games)} old games...")

        for game in old_games:
            # get players in this game
            players = db.query(Player).filter(Player.game_id == game.id).all()
            player_ids = [p.id for p in players]

            # delete ALL guesses referencing this game OR its players
            db.query(Guess).filter(
              (Guess.game_id == game.id) |
              (Guess.player_id.in_(player_ids)) |
              (Guess.guessed_player_id.in_(player_ids))
            ).delete(synchronize_session=False)

            # delete statements
            db.query(Statement).filter(
                Statement.game_id == game.id
            ).delete(synchronize_session=False)

            # delete players
            db.query(Player).filter(
                Player.game_id == game.id
            ).delete(synchronize_session=False)

            # delete game
            db.delete(game)

        db.commit()
        print("Cleanup completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during cleanup: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    cleanup_old_games()