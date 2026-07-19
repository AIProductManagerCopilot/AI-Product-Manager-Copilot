import os
import json
import asyncio
import hashlib
import time
from typing import AsyncGenerator, Optional, List
import structlog
import tiktoken
from google import genai
from google.genai import types
from google.genai.errors import APIError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception
from fastapi import Request, Header
from pydantic import BaseModel, Field

# Flat directory import structure targeting your local files
from backend.app.services.schemas import AIInferenceInternalContract, TokenTelemetryMetrics
from backend.app.services.qdrant_client import QdrantVectorMeshClient

logger = structlog.get_logger(__name__)


# ==========================================
# SECTION 1: PRESERVED LEGACY STRUCTURES & METHODS
# ==========================================

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
    
    # Check if text is present to avoid attribute errors and parse it cleanly
    if response.text:
        return json.loads(response.text)
    return {}


# ==========================================
# SECTION 2: MILESTONE 1 PIPELINE FOUNDATIONS
# ==========================================

def is_transient_error(exception: Exception) -> bool:
    """Classifies if an exception is transient and eligible for exponential backoff."""
    if isinstance(exception, APIError):
        # Exclude structural authentication, client permissions, and input schema validation failures
        if exception.code in [401, 403, 400, 422]:
            return False
        return True
    return isinstance(exception, (asyncio.TimeoutError, ConnectionError))


class GeminiOrchestrationEngine:
    def __init__(self):
        self.api_key = os.environ["GEMINI_API_KEY"]
        self.inference_model = os.environ["GEMINI_API_MODEL"]
        self.embedding_model = os.environ["EMBEDDING_MODEL"]
        
        # Explicit connection and write/read transport limits (30-second aggregate threshold)
        self.client = genai.Client(
            api_key=self.api_key,
            http_options={"timeout": 30.0}
        )
        # Thread-pool isolated tokenizer initialization for context budgeting
        self.tokenizer = tiktoken.get_encoding("cl100k_base")

    async def calculate_tokens_isolated(self, text: str) -> int:
        """Offloads structural token calculations to an executor thread to ensure event loop safety."""
        return await asyncio.to_thread(len, self.tokenizer.encode(text))

    @retry(
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception(is_transient_error),
        reraise=True
    )
    async def generate_embedding_vector(self, text: str, correlation_id: str) -> List[float]:
        """Generates embedding vectors via official SDK targeting the configured EMBEDDING_MODEL."""
        log = logger.bind(correlation_id=correlation_id, model=self.embedding_model)
        log.debug("Starting embedding generation sequence")
        
        try:
            # Native SDK execution wrapped for async loop safety
            response = await asyncio.to_thread(
                self.client.models.embed_content,
                model=self.embedding_model,
                contents=text
            )
            
            if not response.embeddings:
                raise ValueError("Embedding engine returned an empty payload structure")
                
            vector = response.embeddings[0].values
            log.info("Embedding vector successfully generated", dimension=len(vector))
            return vector
            
        except Exception as exc:
            log.error("Embedding lifecycle failed execution", error=str(exc))
            raise

    async def generate_inference_stream(
        self, 
        contract: AIInferenceInternalContract, 
        context_text: str,
        action: str,
        route: str
    ) -> AsyncGenerator[str, None]:
        """Generates real-time SSE chunks while enforcing context boundaries and structural metrics logging."""
        prompt_hash = hashlib.sha256(contract.prompt.encode('utf-8')).hexdigest()
        log = logger.bind(
            correlation_id=contract.correlation_id,
            workspace_id=contract.workspace_id,
            action=action,
            route=route,
            prompt_hash=prompt_hash
        )
        
        log.info("Initiating generative stream inference engine operation")
        
        # Assemble structured context boundaries
        full_prompt = f"Context Information:\n{context_text}\n\nUser Query: {contract.prompt}"
        
        # Safety mappings utilizing native SDK v2 structural schema types
        safety_settings = [
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            ),
        ]
        
        config = types.GenerateContentConfig(
            temperature=contract.temperature,
            system_instruction=contract.system_instruction,
            safety_settings=safety_settings,
        )
        
        start_time = time.perf_counter()
        generated_tokens_count = 0
        
        try:
            # Resolve generator chunk streams using SDK multi-part operations offloaded to workers
            response_stream = await asyncio.to_thread(
                self.client.models.generate_content_stream,
                model=self.inference_model,
                contents=full_prompt,
                config=config
            )
            
            for chunk in response_stream:
                # Catch client termination vectors actively throughout yield iteration loops
                if await asyncio.current_task().cancelled():
                    log.warn("Asynchronous generation loop caught upstream client disconnect signal")
                    raise asyncio.CancelledError()
                
                chunk_text = chunk.text or ""
                if chunk_text:
                    generated_tokens_count += 1
                    yield chunk_text
                    
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            prompt_tokens_estimated = await self.calculate_tokens_isolated(full_prompt)
            
            metrics = TokenTelemetryMetrics(
                prompt_tokens=prompt_tokens_estimated,
                completion_tokens=generated_tokens_count,
                execution_duration_ms=duration_ms,
                execution_id=contract.correlation_id
            )
            log.info("Generative model stream complete", metrics=metrics.model_dump())
            
        except Exception as exc:
            log.error("Exception intercepted inside AI streaming interface engine", error=str(exc))
            raise exc


class AIOrchestratorServicePipeline:
    def __init__(self):
        self.ai_engine = GeminiOrchestrationEngine()
        self.vector_mesh = QdrantVectorMeshClient()
        self.context_token_ceiling = 4000

    async def execute_rag_inference_pipeline_stream(
        self,
        request: Request,
        prompt: str,
        x_correlation_id: str = Header(...),
        x_workspace_id: str = Header(...),
        x_route: str = Header("unknown"),
        x_action: str = Header("unknown")
    ) -> AsyncGenerator[str, None]:
        """Core programmatic pipeline executing embedded generation, retrieval metrics assembly, and SSE chunk transformations."""
        
        internal_contract = AIInferenceInternalContract(
            prompt=prompt,
            system_instruction="You are an expert Enterprise Product Manager Copilot. Synthesize the provided user feedback insights accurately.",
            temperature=0.1,
            correlation_id=x_correlation_id,
            workspace_id=x_workspace_id
        )
        
        log = logger.bind(correlation_id=x_correlation_id, workspace_id=x_workspace_id)
        
        try:
            # 1. Embed user query payload safely
            query_vector = await self.ai_engine.generate_embedding_vector(
                text=internal_contract.prompt,
                correlation_id=x_correlation_id
            )
            
            # 2. Extract matched document records via isolated tenant workspace filters
            rag_response = await self.vector_mesh.query_semantic_context(
                vector=query_vector,
                workspace_id=x_workspace_id,
                correlation_id=x_correlation_id
            )
            
            # 3. Formulate structured context block while maintaining maximum ceiling bounds
            context_accumulator = []
            current_token_count = 0
            
            for snippet in rag_response.snippets:
                snippet_text = f"[Source: {snippet.payload.source_id}]: {snippet.text}\n"
                snippet_tokens = await self.ai_engine.calculate_tokens_isolated(snippet_text)
                
                if current_token_count + snippet_tokens > self.context_token_ceiling:
                    log.warn("Encountered token allocation limit breach; truncating dynamic retrieval matrix arrays")
                    break
                    
                context_accumulator.append(snippet_text)
                current_token_count += snippet_tokens
            
            aggregated_context = "\n".join(context_accumulator)
            
            # 4. Stream real-time generation outputs using structural SSE frames
            async for chunk in self.ai_engine.generate_inference_stream(
                contract=internal_contract,
                context_text=aggregated_context,
                action=x_action,
                route=x_route
            ):
                # Actively listen for immediate client termination alerts
                if await request.is_disconnected():
                    log.warn("Upstream application edge client disconnected. Terminating active operations.")
                    break
                    
                yield f"data: {json.dumps({'type': 'content', 'content': chunk, 'finished': False})}\n\n"
            
            yield f"data: {json.dumps({'type': 'status', 'content': 'Stream execution resolved', 'finished': True})}\n\n"
            
        except Exception as exc:
            log.error("Fatal routing error captured during async stream orchestration lifecycle", error=str(exc))
            error_payload = json.dumps({"type": "error", "content": "Internal service layer pipeline error occurred", "finished": True})
            yield f"data: {error_payload}\n\n"