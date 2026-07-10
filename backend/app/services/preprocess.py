# backend/app/services/preprocess.py
import re

def clean_customer_feedback(raw_text: str) -> str:
    """
    Executes standard text preprocessing workflows for raw feedback text:
    1. Removes HTML tags/escaped characters.
    2. Standardizes whitespaces and multi-line gaps.
    3. Strips edge junk while preserving semantic meaning for downstream LLM embedding.
    """
    if not raw_text:
        return ""
        
    # 1. Strip out any stray HTML tags (e.g., <br>, <div> from email inputs)
    cleaned = re.sub(r'<[^>]+>', '', raw_text)
    
    # 2. Normalize whitespace gaps and newline characters
    cleaned = re.sub(r'\s+', ' ', cleaned)
    
    # 3. Clean up leading and trailing empty spaces
    cleaned = cleaned.strip()
    
    return cleaned