from fastapi import FastAPI
from HumedadRepository import HumedadRepository
from HumedadDTOS import CreateHumedadRequest

app = FastAPI()

@app.post("/humedad/create")
def create_humedad(dto: CreateHumedadRequest):
    humedad_repo = HumedadRepository()
    humedad_repo.insert_data(dto.humedad)
    return {"message": "Data inserted"}

@app.get("/humedad/list")
def get_humedades():
    humedad_repository = HumedadRepository()
    data = humedad_repository.get_humedad()
    return data
