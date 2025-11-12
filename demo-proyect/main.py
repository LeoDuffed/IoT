from fastapi import FastAPI, HTTPException, status
try:
    # Cuando se ejecuta como paquete: uvicorn demo-proyect.main:app
    from .HumedadRepository import HumedadRepository
    from .HumedadDTOS import CreateHumedadRequest
except ImportError:
    # Cuando se ejecuta dentro de la carpeta: uvicorn main:app
    from HumedadRepository import HumedadRepository
    from HumedadDTOS import CreateHumedadRequest

app = FastAPI(title="Demo Proyecto IoT - Humedad")
humedad_repository = HumedadRepository()


@app.get("/", tags=["status"])
def healthcheck():
    """
    Endpoint raiz para comprobar que el servicio esta activo.
    Provee referencias rapidas para navegar desde el navegador/Postman.
    """
    return {
        "message": "API de humedades en ejecucion",
        "docs": "/docs",
        "endpoints": {
            "crear_registro": "/humedad/create",
            "listar_registros": "/humedad/list",
        },
    }


@app.post("/humedad/create", status_code=status.HTTP_201_CREATED)
def create_humedad(dto: CreateHumedadRequest):
    try:
        humedad_repository.insert_data(dto.humedad)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo insertar el registro: {exc}",
        ) from exc
    return {"message": "Dato insertado con exito"}


@app.get("/humedad/list")
def get_humedades():
    try:
        data = humedad_repository.get_humedad()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudieron obtener los registros: {exc}",
        ) from exc
    return data
