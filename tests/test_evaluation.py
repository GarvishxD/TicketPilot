from app.services.evaluation import evaluate

def test_held_out_evaluation_runs():
    result = evaluate()
    assert result["total"] == 10
    assert result["correct"] == 10
    assert result["accuracy"] == 1
    assert result["per_category"] == {
        "Billing": {"correct": 3, "total": 3, "accuracy": 1},
        "Technical": {"correct": 2, "total": 2, "accuracy": 1},
        "Access": {"correct": 2, "total": 2, "accuracy": 1},
        "General": {"correct": 3, "total": 3, "accuracy": 1},
    }
    assert {key: value["total"] for key, value in result["per_category"].items()} == {
        "Billing": 3, "Technical": 2, "Access": 2, "General": 3,
    }
    assert sum(sum(row.values()) for row in result["confusion_matrix"].values()) == 10

def test_labeled_dataset_has_30_train_and_10_held_out_examples():
    from pathlib import Path
    import json

    root = Path(__file__).resolve().parents[1]
    training = json.loads((root / "sample_data" / "training_tickets.json").read_text(encoding="utf-8"))
    held_out = json.loads((root / "sample_data" / "test_tickets.json").read_text(encoding="utf-8"))
    assert len(training) == 30
    assert len(held_out) >= 10
    assert {ticket["ticket_id"] for ticket in training}.isdisjoint(
        {ticket["ticket_id"] for ticket in held_out}
    )
    assert {ticket["category"] for ticket in training + held_out} == {
        "Billing", "Technical", "Access", "General",
    }
