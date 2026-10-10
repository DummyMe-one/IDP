import { supabase } from '@/lib/supabase/client';
import type {
  Workspace, WorkspaceMember, Project, ProjectMember,
  Environment, EncryptedSecret, Branch, Task, AuditEvent,
  IntegrationConnection, ProjectKeyEnvelope, WorkspaceInvitation,
  UserRole, EnvironmentType, TaskStatus, TaskPriority
} from '@/types';

// ─── Workspaces ─────────────────────────────────────────────────────

export async function createWorkspace(name: string, description: string | null, ownerId: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({ name, slug, description, owner_id: ownerId })
    .select()
    .single();

  if (error) throw error;

  // Add owner as member
  const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: ownerId,
    role: 'owner',
  });
  if (memberError) throw memberError;

  // Log audit event
  await logAuditEvent({
    actor_id: ownerId,
    action: 'workspace.created',
    resource_type: 'workspace',
    resource_id: workspace.id,
    workspace_id: workspace.id,
    outcome: 'success',
  });

  return workspace as Workspace;
}

export async function getWorkspaces(userId: string) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      workspace:workspaces(*),
      role
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map(d => ({ ...(d.workspace as unknown as Workspace), member_role: d.role as UserRole }));
}

export async function updateWorkspace(id: string, updates: Partial<Workspace>) {
  const { data, error } = await supabase
    .from('workspaces')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Workspace;
}

export async function archiveWorkspace(id: string) {
  return updateWorkspace(id, { is_archived: true });
}

// ─── Workspace Members ──────────────────────────────────────────────

export async function getWorkspaceMembers(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('workspace_id', workspaceId);
  if (error) throw error;
  return data as (WorkspaceMember & { profile: any })[];
}

export async function addWorkspaceMember(workspaceId: string, userId: string, role: UserRole) {
  const { data, error } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspaceId, user_id: userId, role })
    .select()
    .single();
  if (error) throw error;
  return data as WorkspaceMember;
}

export async function removeWorkspaceMember(workspaceId: string, userId: string) {
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateMemberRole(workspaceId: string, userId: string, role: UserRole) {
  const { error } = await supabase
    .from('workspace_members')
    .update({ role })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Invitations ────────────────────────────────────────────────────

export async function createInvitation(workspaceId: string, email: string, role: UserRole, invitedBy: string) {
  const token = crypto.randomUUID();
  const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const tokenHashStr = Array.from(new Uint8Array(tokenHash)).map(b => b.toString(16).padStart(2, '0')).join('');

  const { data, error } = await supabase
    .from('workspace_invitations')
    .insert({
      workspace_id: workspaceId,
      email,
      role,
      token_hash: tokenHashStr,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invited_by: invitedBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data as WorkspaceInvitation;
}

export async function getPendingInvitations(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspace_invitations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .gte('expires_at', new Date().toISOString());
  if (error) throw error;
  return data as WorkspaceInvitation[];
}

// ─── Projects ───────────────────────────────────────────────────────

export async function createProject(workspaceId: string, name: string, description: string | null, repositoryUrl: string | null, ownerId: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ workspace_id: workspaceId, name, slug, description, repository_url: repositoryUrl, owner_id: ownerId })
    .select()
    .single();
  if (error) throw error;

  // Add owner as project member
  await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: ownerId,
    role: 'owner',
  });

  // Create default environments
  const envTypes: EnvironmentType[] = ['development', 'testing', 'staging', 'production'];
  for (const type of envTypes) {
    await supabase.from('environments').insert({
      project_id: project.id,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      type,
    });
  }

  await logAuditEvent({
    actor_id: ownerId,
    action: 'project.created',
    resource_type: 'project',
    resource_id: project.id,
    workspace_id: workspaceId,
    project_id: project.id,
    outcome: 'success',
  });

  return project as Project;
}

export async function getProjects(workspaceId?: string) {
  let query = supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (workspaceId) query = query.eq('workspace_id', workspaceId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Project[];
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

export async function archiveProject(id: string) {
  return updateProject(id, { status: 'archived' });
}

// ─── Environments ───────────────────────────────────────────────────

export async function getEnvironments(projectId: string) {
  const { data, error } = await supabase
    .from('environments')
    .select('*')
    .eq('project_id', projectId)
    .order('type');
  if (error) throw error;
  return data as Environment[];
}

export async function createEnvironment(projectId: string, name: string, type: EnvironmentType) {
  const { data, error } = await supabase
    .from('environments')
    .insert({ project_id: projectId, name, type })
    .select()
    .single();
  if (error) throw error;
  return data as Environment;
}

// ─── Secrets ────────────────────────────────────────────────────────

export async function getSecrets(environmentId: string) {
  const { data, error } = await supabase
    .from('encrypted_secrets')
    .select('*')
    .eq('environment_id', environmentId)
    .order('variable_name');
  if (error) throw error;
  return data as EncryptedSecret[];
}

export async function createSecret(
  environmentId: string,
  projectId: string,
  variableName: string,
  encryptedValue: string,
  nonce: string,
  keyVersion: number
) {
  const { data, error } = await supabase
    .from('encrypted_secrets')
    .insert({
      environment_id: environmentId,
      project_id: projectId,
      variable_name: variableName,
      encrypted_value: encryptedValue,
      nonce,
      key_version: keyVersion,
    })
    .select()
    .single();
  if (error) throw error;
  return data as EncryptedSecret;
}

export async function deleteSecret(id: string) {
  const { error } = await supabase.from('encrypted_secrets').delete().eq('id', id);
  if (error) throw error;
}

// ─── Branches ───────────────────────────────────────────────────────

export async function getBranches(projectId: string) {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data as Branch[];
}

export async function createBranch(projectId: string, name: string, repositoryRef?: string) {
  const { data, error } = await supabase
    .from('branches')
    .insert({ project_id: projectId, name, repository_ref: repositoryRef || null })
    .select()
    .single();
  if (error) throw error;
  return data as Branch;
}

export async function updateBranch(id: string, updates: Partial<Branch>) {
  const { data, error } = await supabase
    .from('branches')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Branch;
}

export async function deleteBranch(id: string) {
  const { error } = await supabase.from('branches').delete().eq('id', id);
  if (error) throw error;
}

// ─── Tasks ──────────────────────────────────────────────────────────

export async function getTasks(projectId?: string, status?: TaskStatus) {
  let query = supabase.from('tasks').select(`
    *,
    assignee:profiles!assignee_id(*)
  `).order('created_at', { ascending: false });
  
  if (projectId) query = query.eq('project_id', projectId);
  if (status) query = query.eq('status', status);
  
  const { data, error } = await query;
  if (error) throw error;
  return data as (Task & { assignee: any })[];
}

export async function createTask(projectId: string, title: string, description: string | null, priority: TaskPriority = 'medium') {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ project_id: projectId, title, description, priority })
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// ─── Audit Events ───────────────────────────────────────────────────

export async function logAuditEvent(event: {
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  workspace_id?: string;
  project_id?: string;
  outcome?: 'success' | 'failure';
  metadata?: Record<string, unknown>;
}) {
  await supabase.from('audit_events').insert({
    ...event,
    outcome: event.outcome || 'success',
    metadata: event.metadata || {},
  });
}

export async function getAuditEvents(workspaceId?: string, limit = 50) {
  let query = supabase.from('audit_events').select(`
    *,
    actor:profiles!actor_id(*)
  `).order('created_at', { ascending: false }).limit(limit);
  
  if (workspaceId) query = query.eq('workspace_id', workspaceId);
  
  const { data, error } = await query;
  if (error) throw error;
  return data as (AuditEvent & { actor: any })[];
}

// ─── Project Key Envelopes ──────────────────────────────────────────

export async function getProjectKeyEnvelope(projectId: string, userId: string) {
  const { data, error } = await supabase
    .from('project_key_envelopes')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data as ProjectKeyEnvelope;
}

export async function storeProjectKeyEnvelope(projectId: string, userId: string, encryptedProjectKey: string, keyVersion: number) {
  const { data, error } = await supabase
    .from('project_key_envelopes')
    .upsert({ project_id: projectId, user_id: userId, encrypted_project_key: encryptedProjectKey, key_version: keyVersion })
    .select()
    .single();
  if (error) throw error;
  return data as ProjectKeyEnvelope;
}

// ─── Integrations ───────────────────────────────────────────────────

export async function getIntegration(projectId: string, provider: string) {
  const { data, error } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('project_id', projectId)
    .eq('provider', provider)
    .maybeSingle();
  if (error) throw error;
  return data as IntegrationConnection | null;
}

export async function updateIntegrationStatus(projectId: string, provider: string, status: string, error?: string) {
  const { data, error: dbError } = await supabase
    .from('integration_connections')
    .upsert({
      project_id: projectId,
      provider,
      status,
      last_error: error || null,
      last_sync_at: status === 'connected' ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (dbError) throw dbError;
  return data as IntegrationConnection;
}
