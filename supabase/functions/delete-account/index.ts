// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Sin estos headers, el navegador bloquea la llamada por CORS antes de
// que la función llegue a ejecutarse (falla silenciosa desde el frontend).
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Preflight: el navegador manda un OPTIONS antes del POST real.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('No autorizado', { status: 401, headers: corsHeaders })

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) return new Response('No autorizado', { status: 401, headers: corsHeaders })

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { error } = await adminClient.auth.admin.deleteUser(user.id)
  if (error) return new Response(error.message, { status: 500, headers: corsHeaders })

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})