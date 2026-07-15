# backend/app/services/ai_engine.py
import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# Define the structured structure Gemini must follow
class ExtractedThemeSchema(BaseModel):
    theme: str = Field(..., description="The primary topic/category (e.g., 'UI/UX', 'Bug Fix', 'Feature Request', 'Performance', 'Authentication')")
    summary: str = Field(..., description="A 1-sentence engineering summary of the user's true problem statement.")
    sentiment: str = Field(..., description="Sentiment score: POSITIVE, NEUTRAL, or NEGATIVE")
    urgency_score: int = Field(..., description="Priority tier weight mapped from 1 (Low) to 5 (Critical)")

def analyze_feedback_themes(cleaned_text: str) -> dict:
    """
    Triggers the Gemini API Engine to run semantic pattern processing 
    and output structured, typed JSON data payloads.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    
    system_prompt = (
        "You are an expert Principal AI Product Manager. Your task is to analyze raw "
        "customer reviews, support tickets, and features requests. You must categorize "
        "the text and provide deep insights strictly following the requested JSON schema."
    )
    
    # Updated model argument from gemini-2.5-flash to gemini-3.5-flash
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=f"Analyze this customer workspace input token block: '{cleaned_text}'",
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=ExtractedThemeSchema,
            temperature=0.2
        )
    )
    
    return response.text