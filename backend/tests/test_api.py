from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# test root endpoint
def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200


# test create a game
def test_create_game():
    response = client.post("/games", json={"host_name": "Fred", "passcode": "1234"})
    assert response.status_code == 200
    data = response.json()

    assert "game_id" in data
    assert data["status"] == "waiting"


def test_create_game_without_host_name():
    response = client.post("/games", json={"passcode": "1234"})
    assert response.status_code == 422


def test_start_game():
    ## create a game
    game = client.post("/games", json={"host_name": "Fatma", "passcode": "1234"}).json()

    game_id = game["game_id"]

    ## add 3 players
    client.post(
        f"/games/{game_id}/players",
        json={"name": "Sheida", "statement": "Hello world", "passcode": "1234"},
    )
    client.post(
        f"/games/{game_id}/players",
        json={"name": "Fatma", "statement": "Hello world", "passcode": "1234"},
    )
    client.post(
        f"/games/{game_id}/players",
        json={"name": "Jesus", "statement": "Hello world", "passcode": "1234"},
    )
    ## game start
    response = client.post(f"/games/{game_id}/start")

    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


def test_start_noexist_game():
    response = client.post("/games/324899/start")
    assert response.status_code == 404


def test_game_link_created():
    game = client.post("/games", json={"host_name": "Fred", "passcode": "1234"}).json()

    assert "game_link" in game
    assert "game_id" in game["game_link"]
    assert "host_id" in game["game_link"]


# adding players
def test_join_game():
    game = client.post("games", json={"host_name": "Fred", "passcode": "1234"}).json()
    game_id = game["game_id"]

    response = client.post(
        f"/games/{game_id}/players",
        json={"name": "Sheida", "statement": "hello", "passcode": "1234"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Sheida"


def test_join_game_without_statement():
    game = client.post("/games", json={"host_name": "Fred", "passcode": "1234"}).json()

    game_id = game["game_id"]

    response = client.post(
        f"/games/{game_id}/players",
        json={
            "name": "Sheida",
            "passcode": "1234",
            
        },
    )

    assert response.status_code in [400, 422]



def test_join_game_with_wrong_passcode():
    game = client.post("games", json={"host_name": "Fred", "passcode": "1234"}).json()
    game_id = game["game_id"]

    response = client.post(
        f"/games/{game_id}/players",
        json={"name": "Sheida", "statement": "hello", "passcode": "999912399"},
    )
    assert response.status_code == 403
    print("STATUS:", response.status_code)
    print("BODY:", response.json())


def test_join_game_without_passcode():
    game = client.post("/games", json={"host_name": "Fred", "passcode": "1234"}).json()

    game_id = game["game_id"]

    response = client.post(
        f"/games/{game_id}/players",
        json={
            "name": "Sheida",
            "statement": "hello world!!",
        },
    )

    assert response.status_code == 400


def test_duplicate_player_name():
    game = client.post("/games", json={"host_name": "Fred", "passcode": "1234"}).json()

    game_id = game["game_id"]

    client.post(
        f"/games/{game_id}/players",
        json={"name": "Sheida", "statement": "hello", "passcode": "1234"},
    )

    response = client.post(
        f"/games/{game_id}/players",
        json={"name": "Sheida", "statement": "hello again", "passcode": "1234"},
    )

    assert response.status_code == 400


def test_get_players():
    game = client.post("/games", json={"host_name": "Fred", "passcode": "1234"}).json()

    game_id = game["game_id"]

    client.post(
        f"/games/{game_id}/players",
        json={"name": "Sheida", "statement": "hello world", "passcode": "1234"},
    )

    response = client.get(f"/games/{game_id}/players")

    assert response.status_code == 200
    assert len(response.json()) == 1


