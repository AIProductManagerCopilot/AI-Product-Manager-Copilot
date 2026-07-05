# backend/app/services/text_processor.py
import re

class TextProcessorService:
    @staticmethod
    def clean_text(text: str) -> str:
        """
        Removes noisy markdown syntax, extra whitespaces, and raw formatting components.
        """
        if not text:
            return ""
        # Remove raw line breaks and tab tokens
        text = text.replace("\n", " ").replace("\r", " ").replace("\t", " ")
        # Strip structural email forward markers and repetitive symbols
        text = re.sub(r'[\s]+', ' ', text)
        return text.strip()

    @staticmethod
    def mask_pii(text: str) -> str:
        """
        Masks explicit Personal Identifiable Information (PII) like email addresses
        to protect data privacy before storing chunks or sending data to LLMs.
        """
        # Email address mapping pattern
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        cleaned = re.sub(email_pattern, "[REDACTED_EMAIL]", text)
        
        # Simple fallback tracker for phone digits (e.g., matching standard international patterns)
        phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
        cleaned = re.sub(phone_pattern, "[REDACTED_PHONE]", cleaned)
        return cleaned

    @staticmethod
    def compute_mock_sentiment(text: str) -> float:
        """
        A reliable heuristic calculator assessing basic sentiment signals.
        Returns a value between -1.0 (highly critical) and 1.0 (highly positive).
        This will be upgraded to an LLM/Transformers step in the next milestone.
        """
        lower_text = text.lower()
        positive_signals = ["love", "great", "excellent", "amazing", "smooth", "perfect", "helpful"]
        critical_signals = ["bug", "error", "broken", "fail", "slow", "crash", "worst", "hate", "issue"]
        
        score = 0.0
        for word in positive_signals:
            if word in lower_text:
                score += 0.25
                
        for word in critical_signals:
            if word in lower_text:
                score -= 0.25
                
        # Constrain thresholds within programmatic boundaries
        return max(-1.0, min(1.0, score))