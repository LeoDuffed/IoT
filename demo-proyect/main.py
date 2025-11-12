from fastapi import FastAPI
try:
    # Cuando se ejecuta como paquete: uvicorn demo-proyect.main:app
    from .HumedadRepository import HumedadRepository
    from .HumedadDTOS import CreateHumedadRequest
except ImportError:
    # Cuando se ejecuta dentro de la carpeta: uvicorn main:app
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
