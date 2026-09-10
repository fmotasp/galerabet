-- Migração: Criação de RPCs para o Dashboard Enterprise de Relatórios

-- 0. VIEW para filtrar apenas tarefas de Criativos (Designers e Videomakers) e Status Específicos
CREATE OR REPLACE VIEW reports_creative_tasks AS
SELECT t.*
FROM tasks t
LEFT JOIN employees e ON t.assignee_id::text = e.id::text
WHERE 
  (
    t.category ILIKE '%design%' OR 
    t.category ILIKE '%video%' OR 
    t.category ILIKE '%arte%' OR 
    t.category ILIKE '%criação%' OR 
    t.category ILIKE '%criacao%' OR
    e.department ILIKE '%design%' OR 
    e.department ILIKE '%video%' OR 
    e.department ILIKE '%arte%' OR 
    e.role ILIKE '%design%' OR 
    e.role ILIKE '%video%' OR 
    e.role ILIKE '%criativ%'
  )
  AND (
    t.status ILIKE '%back log%' OR 
    t.status ILIKE '%backlog%' OR 
    t.status ILIKE '%novo pedido%' OR 
    t.status ILIKE '%aprov%' OR 
    t.status = 'in_review' OR
    t.status ILIKE '%postar%' OR 
    t.status ILIKE '%andamento%' OR 
    t.status = 'in_progress' OR
    t.status ILIKE '%concluid%' OR 
    t.status ILIKE '%concluíd%' OR 
    t.status = 'done'
  );

-- 1. get_kpis_summary()
-- Retorna Lead Time Médio, Taxa de Entrega no Prazo, Gargalo Atual e Top Performer
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
  -- Lead Time Médio (dias entre created_at e last_moved_at das tarefas concluídas neste mês)
  SELECT COALESCE(AVG(
    EXTRACT(EPOCH FROM (to_timestamp(last_moved_at / 1000.0) - created_at)) / 86400
  ), 0)
  INTO v_lead_time
  FROM reports_creative_tasks
  WHERE (status ILIKE '%concluid%' OR status ILIKE '%concluíd%' OR status = 'done')
    AND date_trunc('month', created_at) = date_trunc('month', current_date);

  -- Taxa de entrega no prazo (heurística simplificada)
  SELECT count(*) INTO v_total_completed
  FROM reports_creative_tasks
  WHERE (status ILIKE '%concluid%' OR status ILIKE '%concluíd%' OR status = 'done')
    AND date_trunc('month', created_at) = date_trunc('month', current_date);

  -- Assumindo que due_date é YYYY-MM-DD
  SELECT count(*) INTO v_on_time_completed
  FROM reports_creative_tasks
  WHERE (status ILIKE '%concluid%' OR status ILIKE '%concluíd%' OR status = 'done')
    AND date_trunc('month', created_at) = date_trunc('month', current_date)
    AND due_date IS NOT NULL
    AND due_date ~ '^\d{4}-\d{2}-\d{2}$'
    AND to_timestamp(last_moved_at / 1000.0) <= due_date::timestamp;

  IF v_total_completed > 0 THEN
    v_on_time_rate := ROUND((v_on_time_completed::numeric / v_total_completed::numeric) * 100, 1);
  ELSE
    v_on_time_rate := 100;
  END IF;

  -- Gargalo Atual (status pendente com mais tarefas)
  SELECT status INTO v_bottleneck
  FROM reports_creative_tasks
  WHERE status NOT ILIKE '%concluid%' AND status NOT ILIKE '%concluíd%' AND status != 'done'
  GROUP BY status
  ORDER BY count(*) DESC
  LIMIT 1;

  -- Top Performer (usuário com mais entregas no mês)
  SELECT assignee_name INTO v_top_performer
  FROM reports_creative_tasks
  WHERE (status ILIKE '%concluid%' OR status ILIKE '%concluíd%' OR status = 'done')
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
  SELECT json_agg(json_build_object('name', status, 'value', cnt, 'color', 
    CASE 
      WHEN status ILIKE '%back log%' OR status ILIKE '%backlog%' OR status ILIKE '%novo pedido%' THEN '#94A3B8'
      WHEN status ILIKE '%andamento%' OR status = 'in_progress' THEN '#5D55F9'
      WHEN status ILIKE '%aprov%' OR status = 'in_review' THEN '#0284C7'
      WHEN status ILIKE '%postar%' THEN '#F59E0B'
      WHEN status ILIKE '%concluid%' OR status ILIKE '%concluíd%' OR status = 'done' THEN '#16A34A'
      ELSE '#888888'
    END
  ))
  INTO result
  FROM (
    SELECT status, count(*) as cnt
    FROM reports_creative_tasks
    GROUP BY status
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
    WHERE status NOT ILIKE '%concluid%' AND status NOT ILIKE '%concluíd%' AND status != 'done'
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
    WHERE (status ILIKE '%concluid%' OR status ILIKE '%concluíd%' OR status = 'done')
      AND to_timestamp(last_moved_at / 1000.0) >= current_date - 7
    GROUP BY d_date
  ) t ON d.day_date = t.d_date;

  RETURN COALESCE(result, '[]');
END;
$$ LANGUAGE plpgsql;
