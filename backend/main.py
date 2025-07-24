
# FastAPIアプリ本体、ルーティング

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from backend import crud, models, schemas, database
from fastapi.staticfiles import StaticFiles


app = FastAPI()
models.Base.metadata.create_all(bind=database.engine)

app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

# CORS（他ドメインからのアクセス許可：開発用には * を許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class CaptureRequest(BaseModel):
    pokemon_id: int

@app.get("/api/captured")
def get_captured(db: Session = Depends(get_db)):
    pokemons = crud.get_all_captured(db)
    return [p.id for p in pokemons]

@app.post("/api/captured")
def add_captured(req: schemas.CaptureRequest, db: Session = Depends(get_db)):
    pokemons = crud.add_captured(db, req.pokemon_id)
    return {"status": "ok", "captured": [p.id for p in pokemons]}