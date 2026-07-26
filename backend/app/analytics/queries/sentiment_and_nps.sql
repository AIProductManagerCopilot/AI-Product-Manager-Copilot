-- ====================================================================
-- Domain 2: Customer Feedback & Sentiment Engine
-- File: backend/app/analytics/queries/sentiment_and_nps.sql
-- Description: Calculates Net Promoter Score (NPS), Weighted Sentiment,
--              and Category Distribution over a configurable date range.
-- ====================================================================

WITH cte_feedback_filtered AS (
    SELECT 
        f.id,
        f.workspace_id,
        f.category,
        f.rating,
        f.sentiment_score,
        LOWER(CAST(f.severity AS TEXT)) AS severity,
        f.created_at
    FROM feedback AS f
    WHERE 
        f.rating IS NOT NULL
        AND (f.workspace_id = :workspace_id OR :workspace_id IS NULL)
        AND f.created_at >= :start_date 
        AND f.created_at <= :end_date
),

cte_nps_classification AS (
    SELECT
        CAST(COUNT(*) AS NUMERIC) AS total_responses,
        CAST(COUNT(CASE WHEN f.rating >= 9 THEN 1 END) AS NUMERIC) AS promoters,
        CAST(COUNT(CASE WHEN f.rating >= 7 AND f.rating <= 8 THEN 1 END) AS NUMERIC) AS passives,
        CAST(COUNT(CASE WHEN f.rating <= 6 THEN 1 END) AS NUMERIC) AS detractors,
        -- Severity weight allocation
        CAST(
            SUM(
                CASE LOWER(CAST(f.severity AS TEXT))
                    WHEN 'critical' THEN 3.0
                    WHEN 'high'     THEN 2.0
                    WHEN 'medium'   THEN 1.5
                    WHEN 'low'      THEN 1.0
                    ELSE 1.0
                END * COALESCE(f.sentiment_score, 0.0)
            ) AS NUMERIC
        ) AS weighted_sentiment_sum,
        CAST(
            SUM(
                CASE LOWER(CAST(f.severity AS TEXT))
                    WHEN 'critical' THEN 3.0
                    WHEN 'high'     THEN 2.0
                    WHEN 'medium'   THEN 1.5
                    WHEN 'low'      THEN 1.0
                    ELSE 1.0
                END
            ) AS NUMERIC
        ) AS total_severity_weight
    FROM cte_feedback_filtered AS f
)

SELECT
    c.total_responses,
    c.promoters,
    c.passives,
    c.detractors,
    
    -- Promoter / Detractor Percentages
    ROUND((c.promoters / NULLIF(c.total_responses, 0)) * 100.0, 2) AS promoter_pct,
    ROUND((c.passives / NULLIF(c.total_responses, 0)) * 100.0, 2) AS passive_pct,
    ROUND((c.detractors / NULLIF(c.total_responses, 0)) * 100.0, 2) AS detractor_pct,
    
    -- Net Promoter Score Formula: % Promoters - % Detractors
    ROUND(
        ((c.promoters - c.detractors) / NULLIF(c.total_responses, 0)) * 100.0, 
        2
    ) AS nps_score,
    
    -- Weighted Sentiment Score
    ROUND(
        (c.weighted_sentiment_sum / NULLIF(c.total_severity_weight, 0)),
        4
    ) AS weighted_sentiment_score

FROM cte_nps_classification AS c;