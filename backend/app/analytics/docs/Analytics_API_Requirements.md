# Analytics API Technical Requirements & Integration Specification

**Target Consumer:** Madhu (Backend Lead) & Adnan (Frontend Lead)  
**Author:** Harshita (Analytics & Insights Lead)  
**Module Context:** Analytics & KPI Execution Engine (`/api/v1/analytics/*`)  

---

## 1. Overview
This document specifies the technical requirements, endpoint definitions, payload schemas, and query execution standards for the Analytics module. The engine processes core metrics spanning customer sentiment (NPS), Agile delivery velocity, and lead/cycle time ticket aging.

---

## 2. Endpoint Specifications

### 2.1 Customer Sentiment & Net Promoter Score (NPS)
Calculates overall NPS, sentiment distribution percentage, and severity-weighted NLP sentiment scores over a specified timeframe.

* **HTTP Method:** `GET`
* **Route:** `/api/v1/analytics/sentiment-nps`
* **Query Parameters:**
  * `workspace_id` (optional, `UUID`): Filters feedback by target workspace.
  * `start_date` (required, `ISO 8601 Timestamp`): Start of evaluation window.
  * `end_date` (required, `ISO 8601 Timestamp`): End of evaluation window.
* **SQL Target Query:** `backend/app/analytics/queries/sentiment_and_nps.sql`
* **Response Model:** `NPSAnalyticsResponse`
* **Response Payload Format:**
```json
{
  "total_responses": 150,
  "promoters": 90,
  "passives": 40,
  "detractors": 20,
  "promoter_pct": 60.0,
  "passive_pct": 26.67,
  "detractor_pct": 13.33,
  "nps_score": 46.67,
  "weighted_sentiment_score": 0.6842
}
```

---

### 2.2 Agile Engineering Sprint Velocity
Calculates planned vs. actual story points, completion rates, scope creep metrics, and rolling average velocity across closed sprints.

* **HTTP Method:** `GET`
* **Route:** `/api/v1/analytics/sprint-velocity`
* **Query Parameters:**
  * `workspace_id` (optional, `UUID`): Filters sprints by target workspace.
  * `limit_sprints` (optional, `int`, default=`10`): Max number of completed sprints to analyze.
* **SQL Target Query:** `backend/app/analytics/queries/sprint_velocity.sql`
* **Response Model:** `List[SprintVelocityResponse]`
* **Response Payload Format:**
```json
[
  {
    "sprint_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sprint_name": "Sprint 24",
    "start_date": "2026-06-01T00:00:00Z",
    "end_date": "2026-06-14T23:59:59Z",
    "total_tickets": 25,
    "completed_tickets": 22,
    "planned_story_points": 50.0,
    "actual_velocity": 44.0,
    "scope_creep_story_points": 6.0,
    "ticket_completion_rate_pct": 88.0,
    "point_predictability_rate_pct": 88.0,
    "scope_creep_pct": 12.0,
    "rolling_avg_velocity": 42.5
  }
]
```

---

### 2.3 Delivery Lead Time, Cycle Time & Ticket Aging
Calculates average lead and cycle times for resolved tickets, alongside open ticket aging distributions and backlog stagnation risk.

* **HTTP Method:** `GET`
* **Route:** `/api/v1/analytics/ticket-aging`
* **Query Parameters:**
  * `workspace_id` (optional, `UUID`): Filters tickets by target workspace.
  * `start_date` (required, `ISO 8601 Timestamp`): Start range for created tickets.
  * `end_date` (required, `ISO 8601 Timestamp`): End range for created tickets.
* **SQL Target Query:** `backend/app/analytics/queries/ticket_aging.sql`
* **Response Model:** `TicketAgingAnalyticsResponse`
* **Response Payload Format:**
```json
{
  "total_resolved_tickets": 110,
  "avg_lead_time_days": 12.4,
  "avg_cycle_time_days": 4.2,
  "total_open_tickets": 35,
  "avg_open_age_days": 18.6,
  "tickets_over_30_days": 8,
  "tickets_over_60_days": 3,
  "tickets_over_90_days": 1,
  "backlog_stagnation_rate_pct": 22.86
}
```

---

## 3. Database Execution & Performance Guidelines
1. **Parameterized Queries:** All SQL files must be executed using SQLAlchemy parameterized queries to prevent SQL injection vulnerabilities.
2. **Division by Zero Safety:** SQL queries use `NULLIF(denominator, 0)` and `COALESCE` to guarantee valid numeric returns (`0.0`) when dataset counts are zero.
3. **Execution Limits:** Sprint history requests must be hard-capped using `limit_sprints` to prevent high latency on large database tables.