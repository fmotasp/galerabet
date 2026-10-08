UPDATE public.tasks
SET attachments = (
  regexp_replace(
    attachments::text,
    'data:image/[^"]+',
    'REMOVIDO',
    'g'
  )
)::jsonb
WHERE attachments::text LIKE '%data:image/%';
