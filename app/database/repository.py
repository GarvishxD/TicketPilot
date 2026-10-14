from app.database.connection import connect
from app.services.classifier import generate_title

FIELDS = ("ticket_id", "message", "category", "priority", "assigned_team", "summary", "suggested_response", "confidence", "review_status", "created_at")

def create_ticket(ticket):
    with connect() as db:
        db.execute(f"INSERT INTO tickets ({','.join(FIELDS)}) VALUES ({','.join('?' for _ in FIELDS)})", tuple(ticket[k] for k in FIELDS))
    return get_ticket(ticket["ticket_id"])

def get_ticket(ticket_id):
    with connect() as db:
        row = db.execute("SELECT * FROM tickets WHERE ticket_id=?", (ticket_id,)).fetchone()
    if not row:
        return None
    ticket = dict(row)
    # Regenerate summaries on read so tickets created before title generation
    # was added also display a concise title derived from their message.
    ticket["summary"] = generate_title(ticket["message"], ticket["category"])
    return ticket

def list_tickets(status=None, category=None, limit=100):
    sql, args, conditions = "SELECT * FROM tickets", [], []
    if status:
        conditions.append("review_status=?"); args.append(status)
    if category:
        conditions.append("category=?"); args.append(category)
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)
    sql += " ORDER BY created_at DESC LIMIT ?"; args.append(limit)
    with connect() as db:
        tickets = [dict(row) for row in db.execute(sql, args).fetchall()]
    for ticket in tickets:
        ticket["summary"] = generate_title(ticket["message"], ticket["category"])
    return tickets

def approve_ticket(ticket_id, reviewer, reviewed_at):
    with connect() as db:
        cursor = db.execute("UPDATE tickets SET review_status='Ready', reviewed_by=?, reviewed_at=? WHERE ticket_id=? AND review_status='PendingReview'", (reviewer, reviewed_at, ticket_id))
        if cursor.rowcount != 1:
            return None
    return get_ticket(ticket_id)

def delete_ticket(ticket_id):
    with connect() as db:
        cursor = db.execute("DELETE FROM tickets WHERE ticket_id=?", (ticket_id,))
        return cursor.rowcount == 1
