"""Explainable keyword baseline, not a trained AI model."""
import re

RULES = {
    "Billing": {"billing", "invoice", "charged", "charge", "payment", "refund", "subscription", "pricing", "price", "receipt", "overcharged"},
    "Technical": {"error", "bug", "crash", "broken", "slow", "failed", "failure", "not working", "doesn't work", "does not work", "exception", "timeout", "upload", "sync"},
    "Access": {"password", "login", "log in", "sign in", "locked", "lockout", "access", "mfa", "two-factor", "2fa", "compromised", "hacked", "account takeover"},
    "General": {"how do i", "how can i", "where can i", "information", "feature", "question", "documentation", "hours", "hello", "thank you"},
}
TEAMS = {"Billing": "Billing Support", "Technical": "Technical Support", "Access": "Account Access Team", "General": "Customer Support"}
HIGH_TERMS = {"compromised", "hacked", "account takeover", "fraud", "unauthorized", "stolen"}

def classify(message):
    text = message.lower()
    scores = {name: sum(term in text for term in terms) for name, terms in RULES.items()}
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    category, top = ranked[0]
    second = ranked[1][1]
    uncertain = top == 0 or top == second
    confidence = 0.35 if top == 0 else (0.55 if uncertain else min(0.95, 0.65 + 0.1 * (top-second)))
    priority = "High" if any(term in text for term in HIGH_TERMS) else ("Low" if category == "General" and not uncertain else "Medium")
    normalized_message = re.sub(r"\s+", " ", message).strip()
    summary = generate_title(normalized_message, category)
    responses = {
      "Billing": "Thanks for contacting us about billing. We will review the charge and follow up with the relevant details.",
      "Technical": "Thanks for reporting this issue. Please share any error details and steps to reproduce it so our technical team can investigate.",
      "Access": "Thanks for contacting us about account access. We will help verify your account and restore access securely.",
      "General": "Thanks for your question. A support specialist will review it and get back to you with the right information."
    }
    return {"category": category, "priority": priority, "assigned_team": TEAMS[category], "summary": summary, "suggested_response": responses[category], "confidence": confidence, "review_status": "PendingReview"}

def generate_title(message, category):
    """Create a short, readable ticket title from the customer's message."""
    text = message.strip().rstrip(".!? ")
    lower = text.lower()
    if category == "Billing" and any(term in lower for term in ("fraud", "unauthorized", "stolen")):
        return "Possible fraudulent billing activity"
    patterns = {
        "Billing": [
            (r"\b(?:charged|charge|billed)\s+(?:me\s+)?(?:twice|again|\w+\s+times)\b", "Duplicate or repeated charge"),
            (r"\brefund\b", "Refund request"),
            (r"\binvoice\b", "Invoice request"),
            (r"\b(?:payment|pay)\b", "Payment issue"),
            (r"\bsubscription\b", "Subscription billing question"),
            (r"\bpricing|price\b", "Pricing question"),
        ],
        "Technical": [
            (r"\bcrash(?:es|ed|ing)?\b", "App crash reported"),
            (r"\b(?:error|exception)\b", "Error reported"),
            (r"\b(?:slow|freez(?:e|es|ing))\b", "Performance issue reported"),
            (r"\b(?:upload|sync|export)\b", "File operation issue"),
            (r"\b(?:bug|broken|not working|does not work|doesn't work)\b", "Product issue reported"),
        ],
        "Access": [
            (r"\b(?:hacked|compromised|unauthorized|stolen|fraud)\b", "Possible account security incident"),
            (r"\bpassword\b", "Password assistance requested"),
            (r"\b(?:locked|lockout)\b", "Account lockout reported"),
            (r"\b(?:login|log in|sign in|access)\b", "Account access issue"),
            (r"\b(?:mfa|two-factor|2fa)\b", "Multi-factor authentication help"),
        ],
        "General": [
            (r"\bdocumentation\b", "Documentation question"),
            (r"\bsupport hours?\b", "Support hours question"),
            (r"\bfeature\b", "Product feature question"),
            (r"\bworkspace\b", "Workspace question"),
        ],
    }
    for pattern, title in patterns.get(category, []):
        if re.search(pattern, lower):
            return title

    words = re.findall(r"[\w'-]+", text)
    if not words:
        return "Customer support request"
    title = " ".join(words[:8])
    if len(words) > 8:
        title += "…"
    return title[:80].rstrip()
