# Architecture

## Overview

DevPortal is an Internal Developer Portal (IDP) built as a single-page application
deployed to GitHub Pages with Supabase as the backend.

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages (Static)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React + TypeScript SPA                               │  │
│  │  ├── Auth (Supabase Auth)                             │  │
│  │  ├── Client-side Crypto (Web Crypto API)              │  │
│  │  ├── UI Components (Tailwind CSS)                     │  │
│  │  └── State Management (React Context)                 │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                     Supabase Platform                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Auth        │  │  PostgreSQL  │  │  Edge Functions  │  │
│  │  (JWT/RLS)   │  │  + RLS       │  │  (GitHub sync)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Authentication**: User authenticates via Supabase Auth → JWT stored in browser
2. **Vault Unlock**: User enters vault passphrase → PBKDF2 derives KEK → decrypts vault key (client-side)
3. **Data Access**: Authenticated requests with JWT → RLS policies enforce access → ciphertext returned
4. **Decryption**: Client decrypts ciphertext with vault/project keys (client-side)
5. **Encryption**: Client encrypts sensitive data before writing to database

## Key Design Decisions

- **Hash-based routing** (`HashRouter`) for GitHub Pages compatibility
- **Client-side encryption** ensures zero-knowledge storage
- **RLS** provides database-level access control
- **Separate vault passphrase** from account password
- **In-memory only** for decrypted keys (never persisted)

## Deployment

- Static build deployed to GitHub Pages via GitHub Actions
- Environment variables configured as GitHub repository variables
- No server-side runtime required for core functionality
