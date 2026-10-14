from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field, field_validator

class TicketCreate(BaseModel):
    ticket_id: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
    message: str = Field(min_length=1, max_length=5000)
    @field_validator("ticket_id", "message")
    @classmethod
    def strip_and_reject_blank(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

class ApprovalRequest(BaseModel):
    reviewer: str = Field(min_length=2, max_length=100)
    @field_validator("reviewer")
    @classmethod
    def reviewer_not_blank(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError("reviewer must contain at least 2 non-space characters")
        return value

class TicketRecord(BaseModel):
    ticket_id: str
    message: str
    category: Literal["Billing", "Technical", "Access", "General"]
    priority: Literal["Low", "Medium", "High"]
    assigned_team: str
    summary: str
    suggested_response: str
    confidence: float
    review_status: Literal["PendingReview", "Ready"]
    created_at: datetime
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
