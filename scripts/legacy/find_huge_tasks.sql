SELECT id, title,
  length(description) as desc_len,
  length(attachments::text) as att_len,
  length(comments::text) as com_len,
  length(activity_log::text) as act_len,
  length(reference_images::text) as ref_len
FROM public.tasks
ORDER BY
  length(description) + length(attachments::text) + length(comments::text) + length(activity_log::text) + length(reference_images::text) DESC
LIMIT 10;
