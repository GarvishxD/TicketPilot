from datetime import datetime, timezone
from app.database import repository
from app.services.classifier import classify

def create_ticket(ticket_id, message):
    result = classify(message)
    result.update(ticket_id=ticket_id, message=message, created_at=datetime.now(timezone.utc).isoformat())
    return repository.create_ticket(result)
