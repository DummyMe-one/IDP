# Threat Model

## Assets

1. **User Vault Keys** — 256-bit AES keys protecting all user data
2. **Private Keys** — RSA-OAEP private keys for key wrapping
3. **Project Encryption Keys** — Per-project AES keys for secrets
4. **Secret Values** — Environment variables and credentials
5. **Recovery Keys** — High-entropy keys for vault recovery
6. **Session Tokens** — Supabase JWT tokens

## Trust Boundaries

### Browser ↔ Supabase
- **Risk**: Network interception
- **Mitigation**: HTTPS required; ciphertext-only storage

### Frontend Code ↔ User
- **Risk**: Malicious code injection, XSS
- **Mitigation**: CSP headers, input sanitization, no eval()

### Vault Passphrase ↔ KEK
- **Risk**: Offline brute force
- **Mitigation**: PBKDF2 with 600K iterations; strong passphrase required

### Unlocked Vault ↔ Application
- **Risk**: Memory scraping, browser extensions
- **Mitigation**: Manual lock, idle timeout, masked values

## Attacker Profiles

### 1. Database-Only Attacker
- **Has**: Full database access (SQL injection, backup theft)
- **Gets**: Ciphertext, salts, nonces, public keys, metadata
- **Cannot**: Decrypt secrets without vault passphrase or recovery key
- **Risk**: Low — zero-knowledge design

### 2. Frontend Compromise Attacker
- **Has**: Modified JavaScript bundle served to users
- **Gets**: Can intercept passphrase entry, steal unlocked keys
- **Cannot**: Access data when vault is locked
- **Risk**: High when vault is unlocked — user must trust frontend

### 3. Authorized Collaborator
- **Has**: Legitimate project access with unlocked vault
- **Gets**: Can decrypt and copy all project secrets
- **Cannot**: Access other projects without authorization
- **Risk**: Medium — revocation cannot recall already-copied data

### 4. Phishing/Social Engineering
- **Has**: User's vault passphrase through deception
- **Gets**: Full vault access
- **Mitigation**: User education; recovery key as backup

## Residual Risks

1. **Browser compromise** — malware, malicious extensions
2. **Supply chain attack** — compromised npm package or CDN
3. **Side-channel attacks** — timing, cache-based (theoretical)
4. **Quantum computing** — future threat to RSA-4096 (long-term)
5. **User error** — weak passphrase, lost recovery key, shared screen
