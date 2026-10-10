# Encryption Format

## Version: 1

### Symmetric Encryption (AES-256-GCM)

**Parameters:**
- Algorithm: AES-GCM
- Key length: 256 bits
- Nonce: 12 bytes (96 bits), unique per operation
- Tag: 128 bits (implicit in GCM)

**Serialized Format:**
```json
{
  "ciphertext": "<base64>",
  "nonce": "<base64>",
  "version": "1",
  "key_version": 1,
  "aad": "<optional additional authenticated data>"
}
```

### Key Derivation (PBKDF2)

**Parameters:**
- Algorithm: PBKDF2-HMAC-SHA256
- Iterations: 600,000
- Salt: 32 bytes (random)
- Output: 256-bit key

**Stored Format:**
```json
{
  "kdf_algorithm": "argon2id",
  "kdf_version": 1,
  "kdf_params": { "memoryCost": 65536, "timeCost": 3, "parallelism": 4 },
  "kdf_salt": "<base64>",
  "actual_implementation": "PBKDF2-SHA256-600000"
}
```

*Note: kdf_algorithm field indicates the intended algorithm. Current implementation
uses PBKDF2 as a compatible fallback. Migrate to Argon2id via libsodium WASM.*

### Asymmetric Encryption (RSA-OAEP)

**Parameters:**
- Algorithm: RSA-OAEP
- Modulus: 4096 bits
- Hash: SHA-256
- Public exponent: 65537

**Public Key Format:** JWK (JSON Web Key)
**Private Key Format:** PKCS#8, encrypted with AES-256-GCM under vault key

### Key Hierarchy

```
Vault Passphrase (user-chosen, ≥12 chars)
    │
    ├── PBKDF2(salt, 600K iterations) → KEK
    │       │
    │       └── AES-256-GCM(KEK, nonce) → User Vault Key
    │               │
    │               ├── AES-256-GCM(VK, nonce) → Private Key (PKCS#8)
    │               │
    │               └── RSA-OAEP(member_pub_key) → Project Key envelope
    │                       │
    │                       └── AES-256-GCM(ProjectKey, nonce) → Secret values
    │
    └── Recovery Key (random, 32 bytes → encoded)
            │
            └── PBKDF2(salt, 600K) → Recovery KEK
                    │
                    └── AES-256-GCM(RecoveryKEK, nonce) → User Vault Key
```

### Rotation

**Project Key Rotation:**
1. Generate new project key
2. Re-encrypt all secrets with new key (client-side)
3. Create new envelopes for all authorized members
4. Increment key_version
5. Old ciphertext retained until migration verified
6. Old envelopes invalidated

**Passphrase Change:**
1. Derive new KEK from new passphrase
2. Re-encrypt vault key with new KEK
3. Update stored encrypted vault key, salt, nonce
4. Vault key itself does not change
5. No need to re-encrypt project keys or secrets
