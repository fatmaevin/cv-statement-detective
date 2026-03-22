from pydantic import BaseModel


class JoinGameRequest(BaseModel):
    name: str
    statement: str

class GameCreateRequest(BaseModel):
    host_name: str
    host_id: int
    passcode: str

class SubmitGuessRequest(BaseModel):
    player_id: int
    statement_id: int
    guessed_player_id: int
