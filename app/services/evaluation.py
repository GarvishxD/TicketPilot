import json
from pathlib import Path
from app.services.classifier import classify

def evaluate(path=None):
    source = Path(path) if path else Path(__file__).resolve().parents[2] / "sample_data" / "test_tickets.json"
    tickets = json.loads(source.read_text(encoding="utf-8"))
    labels = ["Billing", "Technical", "Access", "General"]
    matrix = {actual: {predicted: 0 for predicted in labels} for actual in labels}
    correct = 0
    seen_ids = set()
    for ticket in tickets:
        if ticket["ticket_id"] in seen_ids:
            raise ValueError(f"Duplicate ticket ID in evaluation set: {ticket['ticket_id']}")
        seen_ids.add(ticket["ticket_id"])
        if ticket["category"] not in matrix:
            raise ValueError(f"Unknown category in evaluation set: {ticket['category']}")
        predicted = classify(ticket["message"])["category"]
        actual = ticket["category"]
        matrix[actual][predicted] += 1
        correct += predicted == actual
    per_category = {
        label: {
            "correct": matrix[label][label],
            "total": sum(matrix[label].values()),
            "accuracy": matrix[label][label] / sum(matrix[label].values()) if sum(matrix[label].values()) else 0,
        }
        for label in labels
    }
    return {
        "total": len(tickets),
        "correct": correct,
        "accuracy": correct / len(tickets) if tickets else 0,
        "per_category": per_category,
        "confusion_matrix": matrix,
    }

if __name__ == "__main__":
    print(json.dumps(evaluate(), indent=2))
