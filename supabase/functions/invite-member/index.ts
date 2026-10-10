import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Invite Member Edge Function
// Handles workspace invitation sending and acceptance.
// Runs server-side to securely manage invitation tokens.

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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization')

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { workspace_id, email, role, action } = await req.json()

    // Verify inviter has permission
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw new Error('Insufficient permissions to invite members')
    }

    if (action === 'send') {
      // Generate invitation token
      const token = crypto.randomUUID()
      const encoder = new TextEncoder()
      const tokenHash = await crypto.subtle.digest('SHA-256', encoder.encode(token))
      const hashStr = Array.from(new Uint8Array(tokenHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Create invitation
      const { data: invitation, error } = await supabase
        .from('workspace_invitations')
        .insert({
          workspace_id,
          email,
          role: role || 'developer',
          token_hash: hashStr,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          invited_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // In production: send invitation email via Supabase Auth or custom email service
      // The email would contain a link like:
      // https://your-app.com/#/accept-invitation?token=xxx

      // Log audit event
      await supabase.from('audit_events').insert({
        actor_id: user.id,
        action: 'invitation.sent',
        resource_type: 'workspace_invitation',
        resource_id: invitation.id,
        workspace_id,
        outcome: 'success',
        metadata: { invited_email: email, role },
      })

      return new Response(
        JSON.stringify({ success: true, invitation }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'accept') {
      const { token } = await req.json()

      // Find invitation by token hash
      const encoder = new TextEncoder()
      const tokenHash = await crypto.subtle.digest('SHA-256', encoder.encode(token))
      const hashStr = Array.from(new Uint8Array(tokenHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      const { data: invitation, error: invError } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('token_hash', hashStr)
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .single()

      if (invError || !invitation) throw new Error('Invalid or expired invitation')

      // Verify the accepting user matches the invited email
      if (user.email !== invitation.email) {
        throw new Error('This invitation was sent to a different email address')
      }

      // Add user as workspace member
      await supabase.from('workspace_members').insert({
        workspace_id: invitation.workspace_id,
        user_id: user.id,
        role: invitation.role,
      })

      // Mark invitation as accepted
      await supabase
        .from('workspace_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id)

      // Log audit event
      await supabase.from('audit_events').insert({
        actor_id: user.id,
        action: 'invitation.accepted',
        resource_type: 'workspace_invitation',
        resource_id: invitation.id,
        workspace_id: invitation.workspace_id,
        outcome: 'success',
      })

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Unknown action')
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
