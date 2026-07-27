-- ====================================================================
-- Domain 3: Delivery Metrics & Technical Debt Analysis
-- File: backend/app/analytics/queries/ticket_aging.sql
-- Description: Calculates Lead Time, Cycle Time, and Open Bug Aging
--              classified by issue priority and status.
-- ====================================================================

WITH cte_tickets_base AS (
    SELECT 
        t.id AS ticket_id,
        t.workspace_id,
        t.ticket_type,
        t.priority,
        t.status,
        t.created_at,
        t.started_at,
        t.completed_at,
        
        -- Calculate durations in fractional days using standard arithmetic
        ROUND(CAST(EXTRACT(DAY FROM (t.completed_at - t.created_at)) AS NUMERIC), 2) AS lead_time_days,
        ROUND(CAST(EXTRACT(DAY FROM (t.completed_at - t.started_at)) AS NUMERIC), 2) AS cycle_time_days,
        ROUND(CAST(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - t.created_at)) AS NUMERIC), 2) AS open_age_days
        
    FROM tickets AS t
    WHERE 
        (t.workspace_id = :workspace_id OR :workspace_id IS NULL)
        AND t.created_at >= :start_date 
        AND t.created_at <= :end_date
),

cte_resolved_metrics AS (
    SELECT 
        CAST(COUNT(tb.ticket_id) AS NUMERIC) AS total_resolved_tickets,
        ROUND(CAST(AVG(tb.lead_time_days) AS NUMERIC), 2) AS avg_lead_time_days,
        ROUND(CAST(AVG(tb.cycle_time_days) AS NUMERIC), 2) AS avg_cycle_time_days
    FROM cte_tickets_base AS tb
    WHERE UPPER(CAST(tb.status AS TEXT)) IN ('CLOSED', 'RESOLVED', 'DONE')
),

cte_open_aging_metrics AS (
    SELECT 
        CAST(COUNT(tb.ticket_id) AS NUMERIC) AS total_open_tickets,
        ROUND(CAST(AVG(tb.open_age_days) AS NUMERIC), 2) AS avg_open_age_days,
        CAST(COUNT(CASE WHEN tb.open_age_days > 30 THEN 1 END) AS NUMERIC) AS tickets_over_30_days,
        CAST(COUNT(CASE WHEN tb.open_age_days > 60 THEN 1 END) AS NUMERIC) AS tickets_over_60_days,
        CAST(COUNT(CASE WHEN tb.open_age_days > 90 THEN 1 END) AS NUMERIC) AS tickets_over_90_days
    FROM cte_tickets_base AS tb
    WHERE UPPER(CAST(tb.status AS TEXT)) NOT IN ('CLOSED', 'RESOLVED', 'DONE')
)

SELECT 
    rm.total_resolved_tickets,
    rm.avg_lead_time_days,
    rm.avg_cycle_time_days,
    
    oam.total_open_tickets,
    oam.avg_open_age_days,
    oam.tickets_over_30_days,
    oam.tickets_over_60_days,
    oam.tickets_over_90_days,
    
    ROUND((oam.tickets_over_30_days / NULLIF(oam.total_open_tickets, 0)) * 100.0, 2) AS backlog_stagnation_rate_pct

FROM cte_resolved_metrics AS rm
CROSS JOIN cte_open_aging_metrics AS oam;