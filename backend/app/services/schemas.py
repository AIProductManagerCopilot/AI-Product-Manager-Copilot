from datetime import datetime
from typing import Literal, Optional, List
from pydantic import BaseModel, Field, ConfigDict

class AIInferenceInternalContract(BaseModel):
    model_config = ConfigDict(frozen=True)
    
    prompt: str = Field(..., description="The sanitized inbound core user prompt payload")
    system_instruction: Optional[str] = Field(None, description="System instruction override for context pinning")
    temperature: float = Field(0.2, ge=0.0, le=2.0, description="Inference temperature constraint")
    correlation_id: str = Field(..., description="Read-only request tracking header correlation key")
    workspace_id: str = Field(..., description="Isolated customer directory tenant partition indicator")

class VectorPayloadModel(BaseModel):
    model_config = ConfigDict(frozen=True)
    
    text_chunk: str = Field(..., description="Segmented feedback raw source text payload")
    source_id: str = Field(..., description="Origin source system primary entity tracker key")
    document_id: str = Field(..., description="Parent transcript identifier asset tag")
    chunk_index: int = Field(..., description="Sequential position tracking integer index")
    source_type: str = Field(..., description="Source medium metadata tag classification descriptor")
    sentiment: str = Field(..., description="Evaluated segment sentiment extraction key")
    created_at: datetime = Field(..., description="System timestamp record capture instant")
    workspace_id: str = Field(..., description="Targeted tenant tenant space partitioning constraint")

class RAGContextSnippet(BaseModel):
    model_config = ConfigDict(frozen=True)
    text: str
    score: float
    payload: VectorPayloadModel

class RAGContextResponse(BaseModel):
    model_config = ConfigDict(frozen=True)
    snippets: List[RAGContextSnippet] = Field(..., max_items=5, description="Prioritized array of matched semantic snippets")

class TokenTelemetryMetrics(BaseModel):
    model_config = ConfigDict(frozen=True)
    prompt_tokens: int = Field(..., description="Count of prompt tokens processed")
    completion_tokens: int = Field(..., description="Count of output completion generation tokens")
    execution_duration_ms: int = Field(..., description="Computation duration tracking elapsed milliseconds")
    execution_id: str = Field(..., description="Tracking correlation identifier mapping")