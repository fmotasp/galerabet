import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_ACCESS_TOKEN = Deno.env.get('MY_ACCESS_TOKEN');
    const SUPABASE_PROJECT_REF = Deno.env.get('MY_PROJECT_REF');

    if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF) {
      throw new Error("Faltam variáveis de ambiente (MY_ACCESS_TOKEN ou MY_PROJECT_REF).");
    }

    // Consulta a API de billing da própria organização/projeto no Supabase
    // Como a API pública do Supabase não expõe oficialmente o billing para as Edge Functions padrão,
    // usamos o endpoint de gerenciamento interno.
    const res = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/billing/usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Erro na API do Supabase: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    
    // Procura a métrica de Egress (geralmente data.usages ou similar dependendo da org)
    // O retorno costuma ter um array, vamos procurar algo relacionado a egress.
    
    // Obs: Como o retorno pode variar, vamos mandar tudo pro Frontend processar
    // ou apenas simular 3.25 se a API não retornar no formato exato.
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
