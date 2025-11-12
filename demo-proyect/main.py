from typing import Union

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/humedad/create")
def create_humedad(CreateHumedadRequest):
    print(dto)
    humedad_repo = HumedadRepository()
    humedad_repo.insert_data(dto.humedad)
    return {"message":"Data inserted"}