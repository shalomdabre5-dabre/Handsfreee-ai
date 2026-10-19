from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class Settings(BaseModel):
    sensitivity: float = Field(1.0, ge=0.2, le=3.0)
    dwell_ms: int = Field(1500, ge=500, le=5000)
    voice_feedback: bool = True
    high_contrast: bool = False
    store_session_data: bool = True


class SessionIn(BaseModel):
    duration_seconds: float = Field(..., ge=0)
    commands_attempted: int = Field(0, ge=0)
    commands_recognized: int = Field(0, ge=0)
    task_completion_seconds: Optional[float] = Field(None, ge=0)
    accidental_activations: int = Field(0, ge=0)
    calibration_seconds: Optional[float] = Field(None, ge=0)

    @model_validator(mode="after")
    def recognized_not_more_than_attempted(self):
        if self.commands_recognized > self.commands_attempted:
            raise ValueError("commands_recognized cannot exceed commands_attempted")
        return self


class SessionOut(SessionIn):
    id: str
    created_at: datetime


class Analytics(BaseModel):
    total_sessions: int
    commands_attempted: int
    commands_recognized: int
    accuracy_percent: Optional[float]  # None when no commands were attempted
    avg_task_completion_seconds: Optional[float]
    accidental_activations: int
    avg_calibration_seconds: Optional[float]
