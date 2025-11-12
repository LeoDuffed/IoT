from pydantic import BaseModel

class CreateHumedadRequest(BaseModel):
    humedad: float