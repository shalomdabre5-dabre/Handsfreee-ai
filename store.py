"""In-memory development store.

LIMITATION: data is lost whenever the server restarts (and Render's free tier
restarts often). Phase 4 replaces this file with a PostgreSQL/Supabase version
that exposes the same functions, so main.py will not need to change.
"""
from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4

from .models import Analytics, SessionIn, SessionOut, Settings

_settings = Settings()
_sessions: List[SessionOut] = []


def get_settings() -> Settings:
    return _settings


def save_settings(new: Settings) -> Settings:
    global _settings
    _settings = new
    return _settings


def add_session(data: SessionIn) -> SessionOut:
    s = SessionOut(id=str(uuid4()), created_at=datetime.now(timezone.utc), **data.model_dump())
    _sessions.append(s)
    return s


def list_sessions() -> List[SessionOut]:
    return list(reversed(_sessions))  # newest first


def _avg(values: List[float]) -> Optional[float]:
    return round(sum(values) / len(values), 2) if values else None


def analytics() -> Analytics:
    attempted = sum(s.commands_attempted for s in _sessions)
    recognized = sum(s.commands_recognized for s in _sessions)
    return Analytics(
        total_sessions=len(_sessions),
        commands_attempted=attempted,
        commands_recognized=recognized,
        accuracy_percent=round(recognized / attempted * 100, 1) if attempted else None,
        avg_task_completion_seconds=_avg([s.task_completion_seconds for s in _sessions if s.task_completion_seconds is not None]),
        accidental_activations=sum(s.accidental_activations for s in _sessions),
        avg_calibration_seconds=_avg([s.calibration_seconds for s in _sessions if s.calibration_seconds is not None]),
    )
