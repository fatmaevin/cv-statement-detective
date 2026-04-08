import time
from app.cleanup_games import cleanup_old_games

INTERVAL = 60 * 60  # 1 hour

def run():
    print("Cleanup worker started...")

    while True:
        try:
            print("🧹 Running cleanup...")
            cleanup_old_games()
            print("Cleanup done.")
        except Exception as e:
            print(f"Cleanup failed: {e}")

        print(f"⏳ Sleeping for {INTERVAL} seconds...\n")
        time.sleep(INTERVAL)


if __name__ == "__main__":
    run()