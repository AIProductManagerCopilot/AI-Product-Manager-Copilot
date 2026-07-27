from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class NPSAnalyticsResponse(BaseModel):
    """Schema for Feedback Sentiment & NPS Analysis response."""
    total_responses: int = Field(..., description="Total feedback responses evaluated")
    promoters: int = Field(..., description="Responses with rating 9-10")
    passives: int = Field(..., description="Responses with rating 7-8")
    detractors: int = Field(..., description="Responses with rating 0-6")
    promoter_pct: float = Field(..., description="Percentage of promoters")
    passive_pct: float = Field(..., description="Percentage of passives")
    detractor_pct: float = Field(..., description="Percentage of detractors")
    nps_score: float = Field(..., description="Net Promoter Score (-100 to 100)")
    weighted_sentiment_score: float = Field(..., description="Weighted average sentiment score (-1 to 1)")


class SprintVelocityResponse(BaseModel):
    """Schema for Sprint Velocity & Predictability metrics."""
    sprint_id: UUID = Field(..., description="Unique sprint identifier")
    sprint_name: str = Field(..., description="Display name of the sprint")
    start_date: Optional[datetime] = Field(None, description="Sprint start timestamp")
    end_date: Optional[datetime] = Field(None, description="Sprint end timestamp")
    total_tickets: int = Field(..., description="Total tickets in sprint")
    completed_tickets: int = Field(..., description="Completed tickets count")
    planned_story_points: float = Field(..., description="Planned story points at start")
    actual_velocity: float = Field(..., description="Actual story points delivered")
    scope_creep_story_points: float = Field(..., description="Points added after start")
    ticket_completion_rate_pct: float = Field(..., description="Completion rate percentage")
    point_predictability_rate_pct: float = Field(..., description="Predictability percentage")
    scope_creep_pct: float = Field(..., description="Scope creep percentage")
    rolling_avg_velocity: float = Field(..., description="Rolling 3-sprint average velocity")


class TicketAgingAnalyticsResponse(BaseModel):
    """Schema for Delivery Lead & Cycle Time Aging analytics."""
    total_resolved_tickets: int = Field(..., description="Total resolved tickets in date range")
    avg_lead_time_days: float = Field(..., description="Average lead time in days")
    avg_cycle_time_days: float = Field(..., description="Average cycle time in days")
    total_open_tickets: int = Field(..., description="Total currently open tickets")
    avg_open_age_days: float = Field(..., description="Average age of open tickets in days")
    tickets_over_30_days: int = Field(..., description="Open tickets older than 30 days")
    tickets_over_60_days: int = Field(..., description="Open tickets older than 60 days")
    tickets_over_90_days: int = Field(..., description="Open tickets older than 90 days")
    backlog_stagnation_rate_pct: float = Field(..., description="Percentage of open tickets older than 30 days")
