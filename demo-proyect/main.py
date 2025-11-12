from fastapi import FastAPI, HTTPException, status

try:
    # uvicorn demo-proyect.main:app
    from .HumedadRepository import HumedadRepository
    from .HumedadDTOS import CreateHumedadRequest
except ImportError:
    # uvicorn main:app
    from HumedadRepository import HumedadRepository
    from HumedadDTOS import CreateHumedadRequest

app = FastAPI(title="Demo Proyecto IoT - Humedad")
repository = HumedadRepository()


def _http_500(message: str, exc: Exception) -> HTTPException:
    detail = f"{message}: {exc.__cause__ or exc}"
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


@app.get("/", tags=["status"])
def healthcheck() -> dict:
    return {
        "message": "API de humedades en ejecucion",
        "docs": "/docs",
        "endpoints": {
            "crear_registro": "/humedad/create",
            "listar_registros": "/humedad/list",
        },
    }


@app.post("/humedad/create", status_code=status.HTTP_201_CREATED)
def create_humedad(dto: CreateHumedadRequest) -> dict:
    try:
        repository.insert_data(dto.humedad)
    except Exception as exc:
        raise _http_500("No se pudo insertar el registro", exc) from exc
    return {"message": "Dato insertado con exito"}


@app.get("/humedad/list")
def get_humedades():
    try:
        return repository.get_humedad()
    except Exception as exc:
        raise _http_500("No se pudieron obtener los registros", exc) from exc
