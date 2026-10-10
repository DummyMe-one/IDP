/**
 * Client-side cryptography service for the IDP vault.
 * Uses Web Crypto API with AES-256-GCM and RSA-OAEP.
 * 
 * NOTE: Uses PBKDF2 as KDF fallback. For production, integrate
 * libsodium-wrappers-sumo for Argon2id KDF.
 */

import type { EncryptedPayload } from '@/types';

const CRYPTO_VERSION = '1';
const AES_ALGO = 'AES-GCM';
const AES_KEY_LENGTH = 256;
const NONCE_LENGTH = 12;
const RSA_ALGO = 'RSA-OAEP';
const RSA_HASH = 'SHA-256';
const RSA_MODULUS_LENGTH = 4096;
const PBKDF2_ITERATIONS = 600000;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export class CryptoService {
  static async generateVaultKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: AES_ALGO, length: AES_KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async deriveKeyFromPassphrase(
    passphrase: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as unknown as ArrayBuffer,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: AES_ALGO, length: AES_KEY_LENGTH },
      false,
      ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt']
    );
  }

  static async createVault(passphrase: string): Promise<{
    encryptedVaultKey: string;
    salt: string;
    nonce: string;
  }> {
    const vaultKey = await this.generateVaultKey();
    const salt = generateRandomBytes(32);
    const kek = await this.deriveKeyFromPassphrase(passphrase, salt);
    const nonce = generateRandomBytes(NONCE_LENGTH);

    const exportedKey = await crypto.subtle.exportKey('raw', vaultKey);
    const encrypted = await crypto.subtle.encrypt(
      { name: AES_ALGO, iv: nonce as unknown as BufferSource },
      kek,
      exportedKey
    );

    return {
      encryptedVaultKey: arrayBufferToBase64(encrypted as ArrayBuffer),
      salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
      nonce: arrayBufferToBase64(nonce.buffer as ArrayBuffer),
    };
  }

  static async unlockVault(
    passphrase: string,
    encryptedVaultKey: string,
    salt: string,
    nonce: string
  ): Promise<CryptoKey> {
    const saltBytes = new Uint8Array(base64ToArrayBuffer(salt));
    const kek = await this.deriveKeyFromPassphrase(passphrase, saltBytes);
    const nonceBytes = new Uint8Array(base64ToArrayBuffer(nonce));
    const encryptedKeyBytes = base64ToArrayBuffer(encryptedVaultKey);

    const decrypted = await crypto.subtle.decrypt(
      { name: AES_ALGO, iv: nonceBytes as unknown as BufferSource },
      kek,
      encryptedKeyBytes
    );

    return crypto.subtle.importKey(
      'raw',
      decrypted,
      { name: AES_ALGO, length: AES_KEY_LENGTH },
      true,
      ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );
  }

  static async generateKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(
      {
        name: RSA_ALGO,
        modulusLength: RSA_MODULUS_LENGTH,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: RSA_HASH,
      },
      true,
      ['wrapKey', 'unwrapKey']
    );
  }

  static async exportPublicKey(publicKey: CryptoKey): Promise<string> {
    const jwk = await crypto.subtle.exportKey('jwk', publicKey);
    return JSON.stringify(jwk);
  }

  static async encryptPrivateKey(
    privateKey: CryptoKey,
    vaultKey: CryptoKey
  ): Promise<string> {
    const nonce = generateRandomBytes(NONCE_LENGTH);
    const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
    const encrypted = await crypto.subtle.encrypt(
      { name: AES_ALGO, iv: nonce as unknown as BufferSource },
      vaultKey,
      exported
    );

    const payload: EncryptedPayload = {
      ciphertext: arrayBufferToBase64(encrypted as ArrayBuffer),
      nonce: arrayBufferToBase64(nonce.buffer as ArrayBuffer),
      version: CRYPTO_VERSION,
      key_version: 1,
    };
    return JSON.stringify(payload);
  }

  static async decryptPrivateKey(
    encryptedData: string,
    vaultKey: CryptoKey
  ): Promise<CryptoKey> {
    const payload: EncryptedPayload = JSON.parse(encryptedData);
    const nonce = new Uint8Array(base64ToArrayBuffer(payload.nonce));
    const ciphertext = base64ToArrayBuffer(payload.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: AES_ALGO, iv: nonce as unknown as BufferSource },
      vaultKey,
      ciphertext
    );

    return crypto.subtle.importKey(
      'pkcs8',
      decrypted,
      { name: RSA_ALGO, hash: RSA_HASH },
      true,
      ['unwrapKey']
    );
  }

  static async generateProjectKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: AES_ALGO, length: AES_KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async wrapProjectKeyForMember(
    projectKey: CryptoKey,
    memberPublicKeyJwk: string
  ): Promise<string> {
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      JSON.parse(memberPublicKeyJwk),
      { name: RSA_ALGO, hash: RSA_HASH },
      false,
      ['wrapKey']
    );

    const wrapped = await crypto.subtle.wrapKey(
      'raw',
      projectKey,
      publicKey,
      { name: RSA_ALGO }
    );

    return arrayBufferToBase64(wrapped as ArrayBuffer);
  }

  static async unwrapProjectKeyForMember(
    encryptedProjectKey: string,
    privateKey: CryptoKey
  ): Promise<CryptoKey> {
    const wrappedBytes = base64ToArrayBuffer(encryptedProjectKey);

    return crypto.subtle.unwrapKey(
      'raw',
      wrappedBytes,
      privateKey,
      { name: RSA_ALGO },
      { name: AES_ALGO, length: AES_KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptSecretValue(
    value: string,
    projectKey: CryptoKey,
    aad?: string
  ): Promise<EncryptedPayload> {
    const nonce = generateRandomBytes(NONCE_LENGTH);
    const encoder = new TextEncoder();
    const additionalData = aad ? encoder.encode(aad) : undefined;

    const encrypted = await crypto.subtle.encrypt(
      {
        name: AES_ALGO,
        iv: nonce,
        additionalData,
      } as AesGcmParams,
      projectKey,
      encoder.encode(value)
    );

    return {
      ciphertext: arrayBufferToBase64(encrypted as ArrayBuffer),
      nonce: arrayBufferToBase64(nonce.buffer as ArrayBuffer),
      version: CRYPTO_VERSION,
      key_version: 1,
      aad,
    };
  }

  static async decryptSecretValue(
    payload: EncryptedPayload,
    projectKey: CryptoKey
  ): Promise<string> {
    const nonce = new Uint8Array(base64ToArrayBuffer(payload.nonce));
    const ciphertext = base64ToArrayBuffer(payload.ciphertext);
    const decoder = new TextDecoder();
    const additionalData = payload.aad ? new TextEncoder().encode(payload.aad) : undefined;

    const decrypted = await crypto.subtle.decrypt(
      {
        name: AES_ALGO,
        iv: nonce,
        additionalData,
      } as AesGcmParams,
      projectKey,
      ciphertext
    );

    return decoder.decode(decrypted);
  }

  static async createRecoveryBundle(
    vaultKey: CryptoKey,
    recoveryKey: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const keyHash = await crypto.subtle.digest('SHA-256', encoder.encode(recoveryKey));
    const salt = generateRandomBytes(32);
    const kek = await this.deriveKeyFromPassphrase(recoveryKey, salt);
    const nonce = generateRandomBytes(NONCE_LENGTH);

    const exported = await crypto.subtle.exportKey('raw', vaultKey);
    const encrypted = await crypto.subtle.encrypt(
      { name: AES_ALGO, iv: nonce as unknown as BufferSource },
      kek,
      exported
    );

    return JSON.stringify({
      encrypted_vault_key: arrayBufferToBase64(encrypted as ArrayBuffer),
      salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
      nonce: arrayBufferToBase64(nonce.buffer as ArrayBuffer),
      recovery_key_hash: arrayBufferToBase64(keyHash as ArrayBuffer),
      version: CRYPTO_VERSION,
      created_at: new Date().toISOString(),
    });
  }

  static async recoverVault(
    recoveryBundle: string,
    recoveryKey: string
  ): Promise<CryptoKey> {
    const bundle = JSON.parse(recoveryBundle);
    const salt = new Uint8Array(base64ToArrayBuffer(bundle.salt));
    const nonce = new Uint8Array(base64ToArrayBuffer(bundle.nonce));
    const ciphertext = base64ToArrayBuffer(bundle.encrypted_vault_key);

    const kek = await this.deriveKeyFromPassphrase(recoveryKey, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: AES_ALGO, iv: nonce },
      kek,
      ciphertext
    );

    return crypto.subtle.importKey(
      'raw',
      decrypted,
      { name: AES_ALGO, length: AES_KEY_LENGTH },
      true,
      ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );
  }

  static generateRecoveryKey(): string {
    const bytes = generateRandomBytes(32);
    const segments: string[] = [];
    for (let i = 0; i < bytes.length; i += 4) {
      const num = ((bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]) >>> 0;
      segments.push(num.toString(36).toUpperCase().padStart(5, '0'));
    }
    return segments.join('-');
  }

  static async changePassphrase(
    vaultKey: CryptoKey,
    newPassphrase: string
  ): Promise<{ encryptedVaultKey: string; salt: string; nonce: string }> {
    const salt = generateRandomBytes(32);
    const kek = await this.deriveKeyFromPassphrase(newPassphrase, salt);
    const nonce = generateRandomBytes(NONCE_LENGTH);

    const exported = await crypto.subtle.exportKey('raw', vaultKey);
    const encrypted = await crypto.subtle.encrypt(
      { name: AES_ALGO, iv: nonce as unknown as BufferSource },
      kek,
      exported
    );

    return {
      encryptedVaultKey: arrayBufferToBase64(encrypted as ArrayBuffer),
      salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
      nonce: arrayBufferToBase64(nonce.buffer as ArrayBuffer),
    };
  }
}
