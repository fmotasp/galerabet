import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Origens permitidas: defina ALLOWED_ORIGINS (lista separada por vírgula) nos secrets da função.
// Sem a variável, mantém "*" para não quebrar ambientes existentes, mas o ideal é sempre definir.
export function corsFor(req: Request, extraHeaders = ""): Record<string, string> {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.get("origin") || "";
  const allowOrigin = allowed.length === 0 ? "*" : allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": `authorization, x-client-info, apikey, content-type${extraHeaders ? ", " + extraHeaders : ""}`,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
    "Vary": "Origin",
  };
}

// Exige uma sessão de usuário real. A anon key (pública) NÃO basta: ela não identifica nenhum usuário.
export async function requireUser(req: Request, cors: Record<string, string>): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const deny = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (!token) return deny(401, "Autorização necessária.");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return deny(500, "Função mal configurada.");

  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return deny(401, "Sessão inválida ou não autenticada.");

  return null;
}
