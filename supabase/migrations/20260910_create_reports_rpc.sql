-- Migração: Criação de RPCs para o Dashboard Enterprise de Relatórios

-- 0. VIEW para filtrar apenas tarefas de Criativos (Designers e Videomakers) e Status Específicos
CREATE OR REPLACE VIEW reports_creative_tasks AS
SELECT t.*
FROM tasks t
INNER JOIN employees e ON t.assignee_id::text = e.id::text
WHERE 
  (
    e.role ILIKE 'designer' OR 
    e.role ILIKE 'videomaker'
  )
  AND lower(t.status) IN (
    'backlog', 
    'novos_pedidos', 
    'in_progress', 
    'ajustes', 
    'in_review', 
    'postar', 
    'done'
  );

-- 1. get_kpis_summary()
CREATE OR REPLACE FUNCTION get_kpis_summary()
RETURNS json AS $$
DECLARE
  v_lead_time numeric;
  v_on_time_rate numeric;
  v_bottleneck text;
  v_top_performer text;
  v_total_completed integer;
  v_on_time_completed integer;
BEGIN
  -- Lead Time Médio
  SELECT COALESCE(AVG(
    EXTRACT(EPOCH FROM (to_timestamp(last_moved_at / 1000.0) - created_at)) / 86400
  ), 0)
  INTO v_lead_time
  FROM reports_creative_tasks
  WHERE lower(status) = 'done'
    AND date_trunc('month', created_at) = date_trunc('month', current_date);

  -- Taxa de entrega no prazo
  SELECT count(*) INTO v_total_completed
  FROM reports_creative_tasks
  WHERE lower(status) = 'done'
    AND date_trunc('month', created_at) = date_trunc('month', current_date);

  SELECT count(*) INTO v_on_time_completed
  FROM reports_creative_tasks
  WHERE lower(status) = 'done'
    AND date_trunc('month', created_at) = date_trunc('month', current_date)
    AND due_date IS NOT NULL
    AND due_date ~ '^\d{4}-\d{2}-\d{2}$'
    AND to_timestamp(last_moved_at / 1000.0) <= due_date::timestamp;

  IF v_total_completed > 0 THEN
    v_on_time_rate := ROUND((v_on_time_completed::numeric / v_total_completed::numeric) * 100, 1);
  ELSE
    v_on_time_rate := 100;
  END IF;

  -- Gargalo Atual
  SELECT 
    CASE lower(status)
      WHEN 'backlog' THEN 'Backlog'
      WHEN 'novos_pedidos' THEN 'Novos Pedidos'
      WHEN 'in_progress' THEN 'Em Produção'
      WHEN 'in_review' THEN 'Em Aprovação'
      WHEN 'ajustes' THEN 'Ajustes'
      WHEN 'postar' THEN 'Postar'
      ELSE initcap(lower(status))
    END INTO v_bottleneck
  FROM reports_creative_tasks
  WHERE lower(status) != 'done'
  GROUP BY lower(status)
  ORDER BY count(*) DESC
  LIMIT 1;

  -- Top Performer
  SELECT assignee_name INTO v_top_performer
  FROM reports_creative_tasks
  WHERE lower(status) = 'done'
    AND date_trunc('month', created_at) = date_trunc('month', current_date)
    AND assignee_name IS NOT NULL
  GROUP BY assignee_name
  ORDER BY count(*) DESC
  LIMIT 1;

  RETURN json_build_object(
    'leadTime', ROUND(v_lead_time, 1),
    'onTimeRate', v_on_time_rate,
    'bottleneck', COALESCE(v_bottleneck, 'Nenhum'),
    'topPerformer', COALESCE(v_top_performer, 'N/A')
  );
END;
$$ LANGUAGE plpgsql;

-- 2. get_tasks_distribution()
CREATE OR REPLACE FUNCTION get_tasks_distribution()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(json_build_object('name', 
    CASE lower(status_lower)
      WHEN 'backlog' THEN 'Backlog'
      WHEN 'novos_pedidos' THEN 'Novos Pedidos'
      WHEN 'in_progress' THEN 'Em Produção'
      WHEN 'in_review' THEN 'Em Aprovação'
      WHEN 'ajustes' THEN 'Ajustes'
      WHEN 'postar' THEN 'Postar'
      WHEN 'done' THEN 'Concluídos'
      ELSE initcap(status_lower)
    END, 
  'value', cnt))
  INTO result
  FROM (
    SELECT lower(status) as status_lower, count(*) as cnt
    FROM reports_creative_tasks
    GROUP BY lower(status)
  ) t;
  
  RETURN COALESCE(result, '[]');
END;
$$ LANGUAGE plpgsql;

-- 3. get_pending_workload()
CREATE OR REPLACE FUNCTION get_pending_workload()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(json_build_object('name', assignee, 'pendentes', cnt))
  INTO result
  FROM (
    SELECT COALESCE(assignee_name, 'Não Atribuído') as assignee, count(*) as cnt
    FROM reports_creative_tasks
    WHERE lower(status) != 'done'
    GROUP BY COALESCE(assignee_name, 'Não Atribuído')
    ORDER BY count(*) DESC
  ) t;
  
  RETURN COALESCE(result, '[]');
END;
$$ LANGUAGE plpgsql;

-- 4. get_deliveries_last_7_days()
CREATE OR REPLACE FUNCTION get_deliveries_last_7_days()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object('date', d.day_str, 'concluidas', COALESCE(t.cnt, 0))
    ORDER BY d.day_date ASC
  )
  INTO result
  FROM (
    SELECT to_char(current_date - i, 'DD/MM') as day_str, current_date - i as day_date
    FROM generate_series(6, 0, -1) i
  ) d
  LEFT JOIN (
    SELECT date_trunc('day', to_timestamp(last_moved_at / 1000.0))::date as d_date, count(*) as cnt
    FROM reports_creative_tasks
    WHERE lower(status) = 'done'
      AND to_timestamp(last_moved_at / 1000.0) >= current_date - 7
    GROUP BY d_date
  ) t ON d.day_date = t.d_date;

  RETURN COALESCE(result, '[]');
END;
$$ LANGUAGE plpgsql;
