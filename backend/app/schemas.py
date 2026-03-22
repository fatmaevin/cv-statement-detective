from pydantic import BaseModel


class JoinGameRequest(BaseModel):
    name: str
    statement: str
