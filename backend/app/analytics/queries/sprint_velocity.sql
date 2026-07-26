-- ====================================================================
-- Domain 1: Agile Engineering Velocity Engine
-- File: backend/app/analytics/queries/sprint_velocity.sql
-- Description: Calculates planned vs actual velocity, scope creep,
--              predictability rate, and rolling average velocity.
-- ====================================================================

WITH cte_sprints AS (
    SELECT 
        s.id AS sprint_id,
        s.name AS sprint_name,
        s.start_date,
        s.end_date,
        s.created_at
    FROM sprints AS s
    WHERE 
        s.status = 'closed'
        AND (s.workspace_id = :workspace_id OR :workspace_id IS NULL)
    ORDER BY s.end_date DESC
    LIMIT :limit_sprints
),

cte_sprint_ticket_metrics AS (
    SELECT 
        s.sprint_id,
        s.sprint_name,
        s.start_date,
        s.end_date,
        
        COUNT(t.id) AS total_tickets,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) AS completed_tickets,
        
        -- Planned Points: Tickets added before or at sprint start
        COALESCE(
            SUM(CASE WHEN t.created_at <= s.start_date THEN COALESCE(t.story_points, 0) ELSE 0 END), 
            0.0
        ) AS planned_story_points,
        
        -- Actual Velocity: Points completed within the sprint
        COALESCE(
            SUM(CASE WHEN t.status = 'completed' THEN COALESCE(t.story_points, 0) ELSE 0 END), 
            0.0
        ) AS actual_velocity,
        
        -- Scope Creep: Points added AFTER sprint start
        COALESCE(
            SUM(CASE WHEN t.created_at > s.start_date THEN COALESCE(t.story_points, 0) ELSE 0 END), 
            0.0
        ) AS scope_creep_story_points

    FROM cte_sprints AS s
    LEFT JOIN tickets AS t ON t.sprint_id = s.sprint_id
    GROUP BY s.sprint_id, s.sprint_name, s.start_date, s.end_date
)

SELECT 
    m.sprint_id,
    m.sprint_name,
    m.start_date,
    m.end_date,
    m.total_tickets,
    m.completed_tickets,
    m.planned_story_points,
    m.actual_velocity,
    m.scope_creep_story_points,
    
    -- Completion Rate
    ROUND(
        COALESCE((m.completed_tickets * 100.0) / NULLIF(m.total_tickets, 0), 0.0), 
        2
    ) AS ticket_completion_rate_pct,
    
    -- Predictability Rate (% of planned points delivered)
    ROUND(
        COALESCE((m.actual_velocity * 100.0) / NULLIF(m.planned_story_points, 0), 0.0), 
        2
    ) AS point_predictability_rate_pct,
    
    -- Scope Creep Percentage
    ROUND(
        COALESCE((m.scope_creep_story_points * 100.0) / NULLIF(m.planned_story_points, 0), 0.0), 
        2
    ) AS scope_creep_pct,
    
    -- Rolling 3-sprint average velocity
    ROUND(
        AVG(m.actual_velocity) OVER (
            ORDER BY m.end_date ASC 
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ), 
        2
    ) AS rolling_avg_velocity

FROM cte_sprint_ticket_metrics AS m
ORDER BY m.end_date DESC;