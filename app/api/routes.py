import sqlite3
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from app.database import repository
from app.schemas.tickets import ApprovalRequest, TicketCreate, TicketRecord
from app.services.tickets import create_ticket as create_ticket_service

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.post("", response_model=TicketRecord, status_code=201)
def create_ticket(payload: TicketCreate):
    try:
        return create_ticket_service(payload.ticket_id, payload.message)
    except sqlite3.IntegrityError:
        raise HTTPException(409, f"Ticket ID '{payload.ticket_id}' already exists")
    except sqlite3.Error:
        raise HTTPException(503, "Ticket storage is temporarily unavailable")

@router.get("", response_model=list[TicketRecord])
def list_tickets(status: str | None = Query(None, pattern="^(PendingReview|Ready)$"), category: str | None = Query(None, pattern="^(Billing|Technical|Access|General)$"), limit: int = Query(100, ge=1, le=500)):
    try:
        return repository.list_tickets(status, category, limit)
    except sqlite3.Error:
        raise HTTPException(503, "Ticket storage is temporarily unavailable")

@router.get("/{ticket_id}", response_model=TicketRecord)
def get_ticket(ticket_id: str):
    try:
        ticket = repository.get_ticket(ticket_id)
    except sqlite3.Error:
        raise HTTPException(503, "Ticket storage is temporarily unavailable")
    if not ticket:
        raise HTTPException(404, "Ticket not found")
    return ticket

@router.post("/{ticket_id}/approve", response_model=TicketRecord)
def approve_ticket(ticket_id: str, payload: ApprovalRequest):
    try:
        if not repository.get_ticket(ticket_id):
            raise HTTPException(404, "Ticket not found")
        updated = repository.approve_ticket(ticket_id, payload.reviewer, datetime.now(timezone.utc).isoformat())
    except sqlite3.Error:
        raise HTTPException(503, "Ticket storage is temporarily unavailable")
    if not updated:
        raise HTTPException(409, "Ticket is not awaiting review; only PendingReview tickets can be approved")
    return updated

@router.delete("/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: str):
    try:
        deleted = repository.delete_ticket(ticket_id)
    except sqlite3.Error:
        raise HTTPException(503, "Ticket storage is temporarily unavailable")
    if not deleted:
        raise HTTPException(404, "Ticket not found")
