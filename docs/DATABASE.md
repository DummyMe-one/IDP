# Database

## Schema Overview

### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profile data | Own profile only |
| `user_vaults` | Encrypted vault key material | Own vault only |
| `user_crypto_keys` | Public/encrypted private keys | Own + co-member public keys |
| `workspaces` | Team workspace metadata | Members only |
| `workspace_members` | Workspace membership & roles | Members only |
| `workspace_invitations` | Pending invitations | Members + invitees |
| `projects` | Project metadata | Workspace members |
| `project_members` | Project membership | Workspace members |
| `project_key_envelopes` | Per-member encrypted project keys | Own envelope only |
| `environments` | Deployment environments | Project members |
| `encrypted_secrets` | Encrypted variable values | Project members |
| `branches` | Repository branch tracking | Project members |
| `tasks` | Project tasks | Project members |
| `integration_connections` | External service connections | Project members |
| `audit_events` | Security & activity log | Workspace members |

### Roles

- **owner**: Full control, can manage all members and settings
- **admin**: Can manage members, projects, and settings
- **developer**: Can create/edit projects, environments, secrets, tasks
- **viewer**: Read-only access to project data

### Relationships

```
auth.users
  └── profiles (1:1)
  └── user_vaults (1:1)
  └── user_crypto_keys (1:1)
  └── workspace_members (1:N)
      └── workspaces (N:1)
          └── projects (1:N)
              └── project_members (1:N)
              └── project_key_envelopes (1:N)
              └── environments (1:N)
                  └── encrypted_secrets (1:N)
              └── branches (1:N)
              └── tasks (1:N)
              └── integration_connections (1:N)
```

### Encryption Fields

Fields stored as ciphertext (never plaintext):
- `user_vaults.encrypted_vault_key`
- `user_vaults.recovery_envelope`
- `user_crypto_keys.encrypted_private_key`
- `project_key_envelopes.encrypted_project_key`
- `encrypted_secrets.encrypted_value`

Fields stored as plaintext metadata:
- All names, slugs, descriptions
- Timestamps, statuses, roles
- Variable names (not values)
- Branch names, commit metadata

## Migrations

Run migrations in order using Supabase CLI:
```bash
supabase db push
```

Or apply manually via Supabase SQL editor.
