from pydantic import BaseModel
from typing import Optional


class JoinGameRequest(BaseModel):
    name: str
    statement: str
    passcode: Optional[str] = None


class GameCreateRequest(BaseModel):
    host_name: str
    passcode: str


class SubmitGuessRequest(BaseModel):
    player_id: int
    statement_id: int
    guessed_player_id: int

class FinishGameRequest(BaseModel):
    host_forced: bool