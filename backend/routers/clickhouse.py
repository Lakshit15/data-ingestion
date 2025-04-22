from fastapi import APIRouter, HTTPException
from utils.db import get_clickhouse_client

router = APIRouter()

@router.post("/connect")
async def connect_clickhouse(host: str, port: int, jwt: str):
    try:
        client = get_clickhouse_client(host, port, jwt)
        return {"status": "connected"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/tables")
async def list_tables(host: str, port: int, jwt: str):
    client = get_clickhouse_client(host, port, jwt)
    tables = client.execute("SHOW TABLES")
    return {"tables": [t[0] for t in tables]}