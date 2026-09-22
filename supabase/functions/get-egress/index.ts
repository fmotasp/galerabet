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
    // AVISO: A API oficial do Supabase V1 ainda não possui uma rota pública final para Egress.
    // Retornaremos um valor mockado para a interface por enquanto.
    
    const mockData = {
      total_egress_gb: 3.25
    };

    return new Response(
      JSON.stringify({ success: true, data: mockData }),
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
