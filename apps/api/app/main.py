from fastapi import FastAPI

app = FastAPI(title="Akindo API")

@app.get("/health")
def health():
    return {"status": "ok"}