UPDATE public.tasks
SET attachments = (
  regexp_replace(
    regexp_replace(
      attachments::text,
      '"thumbnailUrl":"data:image/[^"]+"',
      '"thumbnailUrl":""',
      'g'
    ),
    '"url":"data:image/[^"]+"',
    '"url":""',
    'g'
  )
)::jsonb
WHERE attachments::text LIKE '%data:image/%';
