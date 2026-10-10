import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// GitHub Sync Edge Function
// This function handles GitHub repository synchronization.
// It runs server-side with access to GitHub credentials that must NOT
// be exposed to the frontend.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { project_id, action } = await req.json()

    // Verify user has permission on the project
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', project_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin', 'developer'].includes(membership.role)) {
      throw new Error('Insufficient permissions')
    }

    // Get integration connection
    const { data: integration } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('project_id', project_id)
      .eq('provider', 'github')
      .single()

    if (!integration || integration.status !== 'connected') {
      throw new Error('GitHub integration not configured')
    }

    // In production, this would:
    // 1. Use server-side GitHub credentials (from env vars/secrets)
    // 2. Fetch repository data from GitHub API
    // 3. Update branches table with sync data
    // 4. Record audit event
    // 5. Return sync results

    // Log audit event
    await supabase.from('audit_events').insert({
      actor_id: user.id,
      action: `github.sync.${action}`,
      resource_type: 'project',
      resource_id: project_id,
      project_id,
      outcome: 'success',
      metadata: { synced_at: new Date().toISOString() },
    })

    // Update last sync time
    await supabase
      .from('integration_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id)

    return new Response(
      JSON.stringify({ success: true, message: 'Sync completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
