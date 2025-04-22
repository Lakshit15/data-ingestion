from fastapi import FastAPI, Query, HTTPException, Form, UploadFile, File
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
from clickhouse_driver import Client
import pandas as pd
import csv
import os

app = FastAPI()

# --------------------------
# Models
# --------------------------
class ColumnInfo(BaseModel):
    name: str
    type: str
    default: str
    comment: str

class IngestionResult(BaseModel):
    ingested_rows: int
    table_schema: Optional[str] = None

# --------------------------
# Helper Functions
# --------------------------
def get_client(host: str, port: int, jwt: str) -> Client:
    return Client(
        host=host,
        port=port,
        user='default',
        password=jwt,
        secure=True
    )

def validate_table_name(table: str) -> bool:
    return all(c.isalnum() or c == '_' for c in table)

# --------------------------
# API Endpoints
# --------------------------
@app.get("/")
async def health_check():
    return {"status": "API is running"}

@app.get("/clickhouse/tables")
async def list_tables(
    host: str = Query(...),
    port: int = Query(default=8443),
    jwt: str = Query(...),
    database: str = Query(default="default")
):
    try:
        client = get_client(host, port, jwt)
        tables = client.execute(f"SHOW TABLES FROM {database}")
        return {"tables": [t[0] for t in tables]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/clickhouse/columns", response_model=List[ColumnInfo])
async def get_columns(
    host: str = Query(...),
    port: int = Query(default=8443),
    jwt: str = Query(...),
    table: str = Query(...),
    database: str = Query(default="default")
):
    try:
        if not validate_table_name(table):
            raise HTTPException(status_code=400, detail="Invalid table name")
            
        client = get_client(host, port, jwt)
        result = client.execute(f"""
            SELECT name, type, default_expression, comment
            FROM system.columns
            WHERE database = '{database}' AND table = '{table}'
            ORDER BY position
        """)
        
        if not result:
            raise HTTPException(status_code=404, detail="Table not found")
            
        return [
            ColumnInfo(
                name=col[0],
                type=col[1],
                default=col[2],
                comment=col[3]
            ) for col in result
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest/file-to-clickhouse", response_model=IngestionResult)
async def file_to_clickhouse(
    host: str = Form(...),
    port: int = Form(default=8443),
    jwt: str = Form(...),
    table: str = Form(...),
    file: UploadFile = File(...),
    create_table: bool = Form(default=True)
):
    try:
        if not validate_table_name(table):
            raise HTTPException(status_code=400, detail="Invalid table name")
            
        df = pd.read_csv(file.file)
        client = get_client(host, port, jwt)
        
        table_schema = None
        if create_table:
            cols = ", ".join([f"{col} String" for col in df.columns])
            table_schema = f"CREATE TABLE {table} ({cols}) ENGINE = MergeTree()"
            client.execute(table_schema)
        
        records = df.to_dict('records')
        client.execute(f"INSERT INTO {table} VALUES", records)
        
        return {
            "ingested_rows": len(records),
            "table_schema": table_schema
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/ingest/clickhouse-to-file")
async def clickhouse_to_file(
    host: str = Query(...),
    port: int = Query(default=8443),
    jwt: str = Query(...),
    table: str = Query(...),
    columns: str = Query(""),
    database: str = Query(default="default"),
    format: str = Query(default="csv", regex="^(csv|tsv)$")
):
    try:
        if not validate_table_name(table):
            raise HTTPException(status_code=400, detail="Invalid table name")
            
        client = get_client(host, port, jwt)
        selected_cols = columns if columns else "*"
        delimiter = "," if format == "csv" else "\t"
        
        data = client.execute(f"SELECT {selected_cols} FROM {database}.{table}")
        if not data:
            raise HTTPException(status_code=404, detail="No data found")
        
        filename = f"{table}_export.{format}"
        with open(filename, "w", newline='', encoding='utf-8') as f:
            writer = csv.writer(f, delimiter=delimiter)
            if columns:
                writer.writerow(columns.split(","))
            writer.writerows(data)
        
        response = FileResponse(filename, media_type=f"text/{format}")
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"
        
        @app.on_event("shutdown")
        def cleanup():
            if os.path.exists(filename):
                os.remove(filename)
                
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)