import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-drive-url",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
};

let cachedToken: string | null = null;
let tokenExp: number = 0;

async function getGoogleToken(serviceAccount: any, scopes: string[]) {
  if (cachedToken && Date.now() < tokenExp) {
    return cachedToken;
  }

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3500;

  const privateKey = await importPKCS8(serviceAccount.private_key, 'RS256');
  const jwt = await new SignJWT({
    iss: serviceAccount.client_email,
    scope: scopes.join(' '),
    aud: serviceAccount.token_uri,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(privateKey);

  const response = await fetch(serviceAccount.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Failed to get access token from Google: ' + JSON.stringify(data));
  }
  
  cachedToken = data.access_token;
  tokenExp = Date.now() + (3000 * 1000); // 50 mins
  
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    const requestedHeaders = req.headers.get('Access-Control-Request-Headers') || 'authorization, x-client-info, apikey, content-type, x-drive-url';
    return new Response('ok', { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Headers': requestedHeaders
      }
    });
  }

  try {
    const targetUrl = req.headers.get('x-drive-url');
    if (!targetUrl) {
      throw new Error("Missing x-drive-url header");
    }

    const serviceAccountStr = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
    if (!serviceAccountStr) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT is not configured");
    }
    const serviceAccount = JSON.parse(serviceAccountStr);

    const token = await getGoogleToken(serviceAccount, [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive'
    ]);

    const reqHeaders = new Headers();
    reqHeaders.set('Authorization', `Bearer ${token}`);
    
    const forbiddenHeaders = ['host', 'origin', 'referer', 'x-drive-url', 'connection', 'accept-encoding', 'authorization', 'content-length'];
    for (const [key, value] of req.headers.entries()) {
      if (!forbiddenHeaders.includes(key.toLowerCase()) && !key.toLowerCase().startsWith('sec-')) {
        reqHeaders.set(key, value);
      }
    }
    
    const body = (req.method !== 'GET' && req.method !== 'HEAD') ? req.body : undefined;

    const res = await fetch(targetUrl, {
      method: req.method,
      headers: reqHeaders,
      body: body
    });

    const resHeaders = new Headers(corsHeaders);
    resHeaders.set('Content-Type', res.headers.get('Content-Type') || 'application/json');

    const data = await res.arrayBuffer();
    return new Response(data, { 
      status: res.status,
      headers: resHeaders 
    });

  } catch (error: any) {
    console.error("Proxy Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
