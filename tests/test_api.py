def create(client, ticket_id, message):
    return client.post("/api/v1/tickets", json={"ticket_id": ticket_id, "message": message})

def test_billing_ticket(client):
    response = create(client, "B-1", "I was charged twice for my invoice")
    assert response.status_code == 201
    assert response.json()["category"] == "Billing"
    assert response.json()["priority"] == "Medium"
    assert response.json()["review_status"] == "PendingReview"

def test_other_categories(client):
    samples = [("T-1", "The app crashes with an error", "Technical"), ("A-1", "I forgot my password and cannot log in", "Access"), ("G-1", "What are your support hours?", "General")]
    for ticket_id, message, category in samples:
        assert create(client, ticket_id, message).json()["category"] == category

def test_ambiguous_routes_to_review(client):
    response = create(client, "U-1", "Something is wrong and I need help")
    assert response.status_code == 201
    assert response.json()["review_status"] == "PendingReview"
    assert response.json()["confidence"] < 0.7

def test_duplicate_id_conflict(client):
    create(client, "D-1", "Please send my invoice")
    assert create(client, "D-1", "Please send my invoice").status_code == 409

def test_blank_or_invalid_message(client):
    assert client.post("/api/v1/tickets", json={"ticket_id":"X", "message":"   "}).status_code == 422
    assert client.post("/api/v1/tickets", json={"ticket_id":"X", "message":""}).status_code == 422
    assert client.post("/api/v1/tickets", json={"ticket_id":"bad id", "message":"hello"}).status_code == 422

def test_retrieve_and_persist(client):
    create(client, "P-1", "Can I get a refund?")
    assert client.get("/api/v1/tickets/P-1").json()["ticket_id"] == "P-1"
    assert client.get("/api/v1/tickets?category=Billing").json()[0]["ticket_id"] == "P-1"

def test_approval_requires_valid_action(client):
    create(client, "R-1", "How can I reset my password?")
    assert client.get("/api/v1/tickets/R-1").json()["review_status"] == "PendingReview"
    approved = client.post("/api/v1/tickets/R-1/approve", json={"reviewer":"Alex Reviewer"})
    assert approved.status_code == 200 and approved.json()["review_status"] == "Ready"
    assert client.post("/api/v1/tickets/R-1/approve", json={"reviewer":"Alex Reviewer"}).status_code == 409
    assert client.post("/api/v1/tickets/R-1/approve", json={"reviewer":" "}).status_code == 422

def test_missing_ticket_errors(client):
    assert client.get("/api/v1/tickets/missing").status_code == 404
    assert client.post("/api/v1/tickets/missing/approve", json={"reviewer":"Reviewer"}).status_code == 404
