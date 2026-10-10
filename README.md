# DevPortal — Internal Developer Portal

A secure, professional Internal Developer Portal (IDP) for managing software projects, environments, encrypted secrets, team collaboration, and development workflows.

## Features

- **🔐 Zero-Knowledge Vault** — Client-side encrypted vault with AES-256-GCM and RSA-OAEP
- **👥 Workspaces & Teams** — Multi-workspace support with role-based access control
- **📁 Project Management** — Create, manage, and archive projects with environments
- **🔑 Encrypted Secrets** — Environment-specific secrets encrypted before database storage
- **📄 .env Import/Export** — Parse, encrypt, and manage environment files locally
- **🌿 Branch Tracking** — Manual branch management with GitHub sync capability
- **✅ Task Management** — Kanban board and list views for project tasks
- **🔗 Integrations** — GitHub, GitLab, Jira, and Slack integration setup
- **📊 Activity & Audit** — Complete audit trail of all actions
- **🌗 Dark/Light Theme** — System-aware theme with manual toggle
- **📱 Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4
- **Icons**: Lucide React
- **Routing**: React Router (Hash-based for GitHub Pages)
- **Charts**: Recharts
- **Backend**: Supabase (Auth, PostgreSQL, RLS, Edge Functions)
- **Crypto**: Web Crypto API (AES-256-GCM, RSA-OAEP, PBKDF2)
- **Deployment**: GitHub Pages via GitHub Actions

## Quick Start

### Prerequisites

- Node.js 20+
- A Supabase project
- GitHub repository (for deployment)

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-org/devportal.git
cd devportal

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Apply database migrations:
   ```bash
   supabase db push
   ```
   Or run each SQL file in `supabase/migrations` in filename order in the SQL editor.
3. Enable email authentication
4. Configure auth callback URLs for hash routing
5. Note your project URL and anon key

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_BASE_PATH=/
```

**⚠️ Never commit `.env` files. Only use publishable/anon keys in frontend.**

## Deployment

### GitHub Pages

1. Set repository variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_BASE_PATH` (e.g., `/devportal/` for project sites)

2. Push to `main` branch — the GitHub Actions workflow handles the rest.

3. Configure Supabase redirect URLs:
   ```
   https://your-username.github.io/your-repo/#/verify-email
   https://your-username.github.io/your-repo/#/reset-password
   ```

## Security

### Encryption Architecture

```
User Passphrase → PBKDF2 → KEK → AES-256-GCM → Vault Key
Vault Key → RSA-OAEP wrap → Project Key envelopes
Project Key → AES-256-GCM → Secret values
```

- **AES-256-GCM** for authenticated symmetric encryption
- **RSA-OAEP (4096-bit)** for key wrapping between members
- **PBKDF2** with 600K iterations for key derivation
- **Zero-knowledge**: Supabase stores only ciphertext

### Important Security Notes

- Vault passphrase is **separate** from account password
- Lost passphrase + recovery key = **permanent data loss**
- No administrator backdoor exists
- Browser memory cannot be guaranteed clear when vault is unlocked
- Authorized collaborators can copy decrypted secrets
- Revocation cannot recall already-obtained copies

See [docs/SECURITY.md](docs/SECURITY.md) and [docs/THREAT-MODEL.md](docs/THREAT-MODEL.md) for details.

## Project Structure

```
├── .github/workflows/    # CI/CD deployment
├── docs/                 # Documentation
├── public/               # Static assets
├── scripts/              # Build and security scripts
├── src/
│   ├── lib/
│   │   ├── supabase/     # Supabase client
│   │   ├── crypto/       # Encryption service
│   │   └── utils/        # Utilities (.env parser)
│   ├── stores/           # React context providers
│   ├── services/         # API service layer
│   ├── types/            # TypeScript types
│   └── App.tsx           # Main application
├── supabase/
│   ├── migrations/       # Database schema
│   └── functions/        # Edge Functions
└── .env.example          # Environment template
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Security](docs/SECURITY.md)
- [Threat Model](docs/THREAT-MODEL.md)
- [Encryption Format](docs/ENCRYPTION-FORMAT.md)
- [Database Schema](docs/DATABASE.md)
- [Supabase Setup](docs/SUPABASE-SETUP.md)
- [GitHub Pages Deployment](docs/GITHUB-PAGES-DEPLOYMENT.md)
- [Key Recovery](docs/KEY-RECOVERY.md)
- [Operations](docs/OPERATIONS.md)

## Development

```bash
# Type check
npm run typecheck

# Build for production
npm run build

# Run security checks
node scripts/check-security-config.mjs
```

## License

MIT
