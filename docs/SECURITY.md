# Security

## Encryption Architecture

### Algorithms
- **Symmetric**: AES-256-GCM (authenticated encryption)
- **Asymmetric**: RSA-OAEP with SHA-256 (key wrapping)
- **Key Derivation**: PBKDF2 with SHA-256, 600,000 iterations
  - *Note: Production should migrate to Argon2id via libsodium WASM*
- **Random**: Web Crypto API (`crypto.getRandomValues`)

### Key Hierarchy

```
User Vault Passphrase
    └── PBKDF2 → Key Encryption Key (KEK)
        └── AES-256-GCM encrypt → User Vault Key (256-bit)
            ├── RSA-OAEP private key (encrypted at rest)
            └── Project Encryption Keys (wrapped per member)
                └── AES-256-GCM encrypt → Secret values
```

### What Supabase Stores
- Encrypted vault key (AES-256-GCM ciphertext)
- KDF salt and parameters
- Encrypted private key material
- Encrypted project key envelopes
- Encrypted secret values
- Public keys (plaintext, by design)
- Non-secret metadata (names, timestamps, statuses)

### What Supabase Never Stores
- Plaintext vault keys
- Plaintext private keys
- Plaintext project keys
- Plaintext secret values
- Vault passphrases
- Recovery keys

## Access Control

### Row Level Security (RLS)
Every table has RLS enabled with explicit policies:
- Users can only access their own vault and crypto keys
- Workspace access requires membership
- Project access requires workspace membership
- Role-based permissions (owner > admin > developer > viewer)
- No self-promotion possible through direct database access

### Authentication
- Supabase Auth with email/password
- JWT tokens for API requests
- Session management with auto-refresh
- Protected routes in the frontend (defense in depth, not sole control)

## Threat Mitigations

| Threat | Mitigation |
|--------|-----------|
| Database breach | Only ciphertext exposed; keys remain client-side |
| Compromised frontend | Unlocked secrets at risk; vault lock mitigates |
| Weak passphrase | Minimum 12 chars; PBKDF2 with high iterations |
| Key substitution | Public key verification during enrollment |
| Self-promotion | RLS prevents role escalation via DB |
| Member revocation | Immediate access removal + key rotation |
| Session hijacking | Short-lived tokens; manual vault lock |

## Security Limitations

1. **Browser memory cannot be guaranteed clear** — unlocked keys exist in JS heap
2. **Authorized collaborators can copy decrypted secrets** — revocation cannot recall
3. **Compromised browser/extension can expose unlocked data**
4. **Lost passphrase + recovery key = permanent data loss**
5. **RLS is access control, not encryption** — defense in depth required
6. **PBKDF2 is weaker than Argon2id** against GPU-based attacks — plan migration

## No Backdoors

There is no administrator decryption capability. If a user loses both their
vault passphrase and recovery key, their encrypted data is permanently
inaccessible. This is by design.
