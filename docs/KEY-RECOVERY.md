# Key Recovery

## Overview

The recovery system allows users to regain access to their vault if they
forget their vault passphrase. It uses a high-entropy recovery key that
protects a separate encrypted copy of the User Vault Key.

## Recovery Key Generation

During vault setup, a recovery key is generated:
- 32 bytes of cryptographically random data
- Encoded as readable segments (base-36)
- Format: `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`

## Recovery Process

1. User indicates they cannot unlock their vault
2. User enters their recovery key
3. System derives KEK from recovery key using PBKDF2
4. Decrypts the recovery envelope to obtain the User Vault Key
5. User sets a new vault passphrase
6. System re-wraps the User Vault Key with the new passphrase
7. Vault is unlocked with the recovered key

## Important Warnings

### Losing Both Passphrase and Recovery Key

If a user loses both their vault passphrase AND recovery key:
- **All encrypted data is permanently inaccessible**
- No administrator or support team can recover the data
- No backdoor exists by design
- The encrypted data remains in the database but cannot be decrypted

### Recovery Key Security

- Store the recovery key offline (printed, safe, etc.)
- Do NOT store it in password managers synced to the cloud
- Do NOT share it with anyone
- Do NOT photograph it on an internet-connected device
- Do NOT store it in the same location as your passphrase

### After Recovery

After using the recovery key:
1. Choose a new, strong vault passphrase
2. Consider generating a new recovery key
3. Store the new recovery key securely
4. The old recovery key is invalidated

## Technical Details

The recovery envelope contains:
```json
{
  "encrypted_vault_key": "<AES-256-GCM ciphertext>",
  "salt": "<PBKDF2 salt, base64>",
  "nonce": "<AES-GCM nonce, base64>",
  "recovery_key_hash": "<SHA-256 hash for verification>",
  "version": "1",
  "created_at": "<ISO timestamp>"
}
```

The recovery key is never stored in:
- Supabase database
- Browser storage (localStorage, sessionStorage, IndexedDB)
- Application state
- Logs or analytics
- URLs
