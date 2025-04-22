from clickhouse_driver import Client

def get_clickhouse_client(host: str, port: int, jwt: str):
    try:
        client = Client(
            host=host,
            port=port,
            user='default',  # or your custom user
            password=jwt,   # JWT as password
            secure=True     # HTTPS
        )
        client.execute("SELECT 1")  # Test connection
        return client
    except Exception as e:
        raise Exception(f"ClickHouse connection failed: {str(e)}")