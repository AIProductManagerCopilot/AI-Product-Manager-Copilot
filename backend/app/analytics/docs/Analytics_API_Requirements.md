# Analytics & Insights API Technical Requirements

**Owner:** Harshita (Analytics & Insights Lead)  
**Target Consumer:** Madhu (Backend Lead)  
**Module Directory:** `backend/app/analytics/`  
**Status:** Approved for Implementation  

---

## 1. Overview & Architecture Interface

This document specifies the exact request/response models, database execution strategies, and exception handling required to wire the Analytics Module into the FastAPI application router (`backend/app/api/v1/endpoints/analytics.py`).

### Data Flow Diagram

```text
Client / Dashboard (Adnan) 
       │
       ▼
FastAPI Router (`/api/v1/analytics/*`) [Madhu]
       │
       ├──► Query Execution Engine (`backend/app/analytics/queries/`) [Harshita]
       ├──► ML / Statistical Services (`backend/app/analytics/services/`) [Harshita]
       └──► Response Serialization (`backend/app/analytics/schemas/analytics_response.py`) [Harshita]

---       

## 2. API Endpoints Specification

### Endpoint 1: Feedback Sentiment & NPS Analysis
* **URL Path:** `GET /api/v1/analytics/sentiment-nps`
* **Query Parameters:**
  * `workspace_id` (UUID, Optional): Filters by workspace.
  * `start_date` (ISO Date, Required): Start timestamp.
  * `end_date` (ISO Date, Required): End timestamp.
* **SQL Query Executed:** `backend/app/analytics/queries/sentiment_and_nps.sql`
* **Response Schema:** `NPSAnalyticsResponse` from `schemas/analytics_response.py`

#### Expected JSON Response Body:
```json
{
  "total_responses": 142,
  "promoters": 85,
  "passives": 38,
  "detractors": 19,
  "promoter_pct": 59.86,
  "passive_pct": 26.76,
  "detractor_pct": 13.38,
  "nps_score": 46.48,
  "weighted_sentiment_score": 0.6215
}