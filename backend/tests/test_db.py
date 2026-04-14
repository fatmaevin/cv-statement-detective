from types import SimpleNamespace

import pytest
from app.services.game_service import create_game, start_game
from app.services.guess_service import submit_guess
from app.services.player_service import join_game
from app.models.statement import Statement
from app.models.player import Player

def test_create_game_db(db):
    game = create_game(db, host_name="Fred", passcode="121334")

    assert game.id is not None
    assert game.host_name == "Fred"
    assert game.passcode == "121334"

    assert game.game_link is not None
    assert "game_id" in game.game_link
    assert "host_id" in game.game_link


def test_start_game_db(db):
    game = create_game(db, host_name="Fatma", passcode="1234")

    player = Player(game_id=game.id, name="Sheida")
    db.add(player)
    db.commit()
    db.refresh(player)

    statement = Statement(game_id=game.id, player_id=player.id, statement="Hello world")
    db.add(statement)
    db.commit()
    db.refresh(statement)

    started_game = start_game(db, game.id)

    assert started_game.status == "in_progress"
    assert started_game.current_statement_id == statement.id
    assert started_game.round_started_at is not None


def test_start_game_twice_db(db):
    game = create_game(db, host_name="Fatma", passcode="1234")

    player = Player(game_id=game.id, name="Sheida")
    db.add(player)
    db.commit()
    db.refresh(player)

    statement = Statement(
        game_id=game.id,
        player_id=player.id,
        statement="Hello world",
    )
    db.add(statement)
    db.commit()
    db.refresh(statement)

    first_start = start_game(db, game.id)

    first_statement_id = first_start.current_statement_id
    first_round_time = first_start.round_started_at

    second_start = start_game(db, game.id)

    assert second_start.current_statement_id == first_statement_id
    assert second_start.round_started_at == first_round_time


def test_submit_guess_correct_increases_score(db):
    game = create_game(db, host_name="Fatma", passcode="1234")

    p1 = join_game(db, game.id, "Jesus", "helloooo", "1234")

    start_game(db, game.id)

    statement = db.query(Statement).filter(Statement.game_id == game.id).first()

    payload = SimpleNamespace(
        statement_id=statement.id,
        player_id=p1.id,
        guessed_player_id=statement.player_id,
    )

    submit_guess(db, game.id, payload)

    db.refresh(statement)

    assert statement.score == 1


def test_submit_guess_duplicate_not_allowed(db):
    game = create_game(db, "Fatma", "1234")

    p1 = join_game(db, game.id, "Jesus", "S1", "1234")
    p2 = join_game(db, game.id, "Fatma", "S2", "1234")

    start_game(db, game.id)

    statement = db.query(Statement).filter(Statement.game_id == game.id).first()

    payload = SimpleNamespace(
        statement_id=statement.id,
        player_id=p1.id,
        guessed_player_id=p2.id,
    )

    submit_guess(db, game.id, payload)

    with pytest.raises(Exception):
        submit_guess(db, game.id, payload)
