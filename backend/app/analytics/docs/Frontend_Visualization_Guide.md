# Analytics Frontend Visualization & Charting Guide

**Target Consumer:** Adnan (Frontend Lead)  
**Author:** Harshita (Analytics & Insights Lead)  
**Module Context:** Analytics Module (`/api/v1/analytics/*`)  

---

## 1. Overview
This guide defines how frontend components should map, transform, and render data returned by the Analytics API endpoints. Follow these conventions for charts, color palettes, and fallback states to keep the metrics consistent across dashboards.

---

## 2. Component Mapping & Chart Specifications

### Endpoint 1: Sentiment & NPS Analysis
* **API Route:** `GET /api/v1/analytics/sentiment-nps`
* **Primary Visual Component:** Gauge Chart (NPS) + Donut Chart (Distribution)

#### Chart Configuration:
* **NPS Gauge Score:**
  * Range: `-100` to `+100`
  * Color Buckets:
    * `< 0`: Red (`#EF4444`)
    * `0 to 30`: Amber (`#F59E0B`)
    * `31 to 70`: Light Green (`#10B981`)
    * `71+`: Emerald Green (`#059669`)
* **Distribution Donut Breakdown:**
  * Promoters (`promoter_pct`): Green (`#10B981`)
  * Passives (`passive_pct`): Slate Gray (`#64748B`)
  * Detractors (`detractor_pct`): Red (`#EF4444`)

---

### Endpoint 2: Sprint Velocity & Predictability
* **API Route:** `GET /api/v1/analytics/sprint-velocity`
* **Primary Visual Component:** Combo Bar & Line Chart

#### Chart Configuration:
* **X-Axis:** `sprint_name` (Ordered chronologically, oldest to newest)
* **Bar Series (Left Y-Axis - Story Points):**
  * `planned_story_points`: Light Blue (`#93C5FD`)
  * `actual_velocity`: Solid Blue (`#2563EB`)
  * `scope_creep_story_points`: Orange (`#F97316`)
* **Line Series (Right Y-Axis - Velocity Trend):**
  * `rolling_avg_velocity`: Dashed Purple Line (`#8B5CF6`)
* **KPI Badge Overlays:**
  * Render `point_predictability_rate_pct` as a status chip:
    * `>= 85%`: Green
    * `70% - 84%`: Yellow
    * `< 70%`: Red

---

### Endpoint 3: Delivery Lead & Cycle Time Aging
* **API Route:** `GET /api/v1/analytics/ticket-aging`
* **Primary Visual Component:** KPI Stat Cards + Horizontal Stacked Bar (Aging Buckets)

#### Chart Configuration:
* **Top Metric Cards:**
  * Average Lead Time: `avg_lead_time_days` days
  * Average Cycle Time: `avg_cycle_time_days` days
  * Backlog Stagnation: `backlog_stagnation_rate_pct`%
* **Aging Distribution Buckets:**
  * `< 30 Days`: Normal (`#3B82F6`)
  * `30 - 60 Days`: Attention (`#F59E0B`)
  * `60 - 90 Days`: High Risk (`#EA580C`)
  * `> 90 Days`: Critical (`#DC2626`)

---

## 3. Empty & Error States

1. **Zero / Null Data (`total_responses == 0`):**
   * Display empty state illustration with message: *"No analytics data available for the selected date range."*
2. **Loading Skeleton:**
   * Render pulse skeletons matching chart aspect ratios during API fetch.