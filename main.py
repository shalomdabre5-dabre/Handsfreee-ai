import os
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import store
from .models import Analytics, SessionIn, SessionOut, Settings

load_dotenv()

app = FastAPI(title="Handsfree AI API", version="0.1.0")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "storage": "in-memory"}


@app.get("/api/settings", response_model=Settings)
def read_settings():
    return store.get_settings()


@app.put("/api/settings", response_model=Settings)
def update_settings(settings: Settings):
    return store.save_settings(settings)


@app.post("/api/sessions", response_model=SessionOut, status_code=201)
def create_session(session: SessionIn):
    return store.add_session(session)


@app.get("/api/sessions", response_model=List[SessionOut])
def get_sessions():
    return store.list_sessions()


@app.get("/api/analytics", response_model=Analytics)
def get_analytics():
    return store.analytics()
