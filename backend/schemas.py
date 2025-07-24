
# Pydanticスキーマ定義

from pydantic import BaseModel

class CaptureRequest(BaseModel):
    pokemon_id: int