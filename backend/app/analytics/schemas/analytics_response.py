from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


# ----------------------------------------------------------------------
# Endpoint 1: Sentiment & NPS Schema
# ----------------------------------------------------------------------
class NPSAnalyticsResponse(BaseModel):
    total_responses: int = Field(..., description="Total feedback entries processed")
    promoters: int = Field(..., description="Count of score 9-10 ratings")
    passives: int = Field(..., description="Count of score 7-8 ratings")
    detractors: int = Field(..., description="Count of score 0-6 ratings")
    promoter_pct: float = Field(..., description="Percentage of promoters")
    passive_pct: float = Field(..., description="Percentage of passives")
    detractor_pct: float = Field(..., description="Percentage of detractors")
    nps_score: float = Field(..., description="Net Promoter Score (-100 to +100)")
    weighted_sentiment_score: float = Field(..., description="Normalized NLP sentiment (-1.0 to +1.0)")


# ----------------------------------------------------------------------
# Endpoint 2: Sprint Velocity Schema
# ----------------------------------------------------------------------
class SprintVelocityResponse(BaseModel):
    sprint_id: UUID
    sprint_name: str
    start_date: datetime
    end_date: datetime
    total_tickets: int
    completed_tickets: int
    planned_story_points: float
    actual_velocity: float
    scope_creep_story_points: float
    ticket_completion_rate_pct: float
    point_predictability_rate_pct: float
    scope_creep_pct: float
    rolling_avg_velocity: float


# ----------------------------------------------------------------------
# Endpoint 3: Ticket Aging & Lead Time Schema
# ----------------------------------------------------------------------
class TicketAgingAnalyticsResponse(BaseModel):
    total_resolved_tickets: int
    avg_lead_time_days: float
    avg_cycle_time_days: float
    total_open_tickets: int
    avg_open_age_days: float
    tickets_over_30_days: int
    tickets_over_60_days: int
    tickets_over_90_days: int
    backlog_stagnation_rate_pct: float
