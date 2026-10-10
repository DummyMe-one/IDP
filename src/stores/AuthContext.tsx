import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CryptoService } from '@/lib/crypto/cryptoService';
import type { Profile, UserVault } from '@/types';
import type { Session, User } from '@supabase/supabase-js';

interface VaultState {
  isLocked: boolean;
  isInitialized: boolean;
  vaultKey: CryptoKey | null;
  privateKey: CryptoKey | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  vault: VaultState;
  isLoading: boolean;
  isOnboarded: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  unlockVault: (passphrase: string) => Promise<{ error: string | null }>;
  lockVault: () => void;
  setupVault: (passphrase: string) => Promise<{ error: string | null; recoveryKey?: string }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    vault: { isLocked: true, isInitialized: false, vaultKey: null, privateKey: null },
    isLoading: true,
    isOnboarded: false,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data) {
      setState(s => ({ ...s, profile: data as Profile }));
    }
  }, []);

  const checkVaultStatus = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_vaults')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!error && data) {
      setState(s => ({
        ...s,
        vault: { ...s.vault, isInitialized: true },
        isOnboarded: true,
      }));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState(s => ({ ...s, user: session.user, session, isLoading: false }));
        fetchProfile(session.user.id);
        checkVaultStatus(session.user.id);
      } else {
        setState(s => ({ ...s, isLoading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState(s => ({ ...s, user: session.user, session, isLoading: false }));
        fetchProfile(session.user.id);
        checkVaultStatus(session.user.id);
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          vault: { isLocked: true, isInitialized: false, vaultKey: null, privateKey: null },
          isLoading: false,
          isOnboarded: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, checkVaultStatus]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    setState(s => ({
      ...s,
      vault: { isLocked: true, isInitialized: s.vault.isInitialized, vaultKey: null, privateKey: null },
    }));
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}#/reset-password`,
    });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  };

  const setupVault = async (passphrase: string): Promise<{ error: string | null; recoveryKey?: string }> => {
    if (!state.user) return { error: 'Not authenticated' };

    try {
      // Create vault
      const vaultData = await CryptoService.createVault(passphrase);
      
      // Generate key pair
      const keyPair = await CryptoService.generateKeyPair();
      const publicKeyJwk = await CryptoService.exportPublicKey(keyPair.publicKey);
      const encryptedPrivateKey = await CryptoService.encryptPrivateKey(keyPair.privateKey, null as any);
      
      // Generate recovery key
      const recoveryKey = CryptoService.generateRecoveryKey();

      // We need the vault key to encrypt the private key
      const vaultKey = await CryptoService.unlockVault(
        passphrase,
        vaultData.encryptedVaultKey,
        vaultData.salt,
        vaultData.nonce
      );

      const encPrivKey = await CryptoService.encryptPrivateKey(keyPair.privateKey, vaultKey);
      const recoveryBundle = await CryptoService.createRecoveryBundle(vaultKey, recoveryKey);

      // Store in Supabase - combine ciphertext + nonce into single field
      const vaultPayload = JSON.stringify({
        ciphertext: vaultData.encryptedVaultKey,
        nonce: vaultData.nonce,
      });
      const { error: vaultError } = await supabase.from('user_vaults').insert({
        user_id: state.user.id,
        encrypted_vault_key: vaultPayload,
        kdf_salt: vaultData.salt,
        kdf_algorithm: 'argon2id',
        kdf_version: 1,
        kdf_params: { memoryCost: 65536, timeCost: 3, parallelism: 4 },
        recovery_envelope: recoveryBundle,
        crypto_version: '1',
      });

      if (vaultError) return { error: vaultError.message };

      const { error: keyError } = await supabase.from('user_crypto_keys').insert({
        user_id: state.user.id,
        public_key: publicKeyJwk,
        encrypted_private_key: encPrivKey,
        key_version: 1,
      });

      if (keyError) return { error: keyError.message };

      // Set vault state
      setState(s => ({
        ...s,
        vault: { isLocked: false, isInitialized: true, vaultKey, privateKey: keyPair.privateKey },
        isOnboarded: true,
      }));

      return { error: null, recoveryKey };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Vault setup failed' };
    }
  };

  const unlockVault = async (passphrase: string): Promise<{ error: string | null }> => {
    if (!state.user) return { error: 'Not authenticated' };

    try {
      const { data: vaultData, error } = await supabase
        .from('user_vaults')
        .select('*')
        .eq('user_id', state.user.id)
        .single();

      if (error || !vaultData) return { error: 'Vault not found' };

      // Parse the vault payload to get ciphertext and nonce
      let ciphertext: string;
      let nonce: string;
      try {
        const payload = JSON.parse((vaultData as UserVault).encrypted_vault_key);
        ciphertext = payload.ciphertext;
        nonce = payload.nonce;
      } catch {
        // Legacy format - nonce was not stored
        return { error: 'Vault data format is outdated. Please reset your vault.' };
      }

      const vaultKey = await CryptoService.unlockVault(
        passphrase,
        ciphertext,
        (vaultData as UserVault).kdf_salt,
        nonce
      );

      // Decrypt private key
      const { data: keyData } = await supabase
        .from('user_crypto_keys')
        .select('*')
        .eq('user_id', state.user.id)
        .single();

      let privateKey: CryptoKey | null = null;
      if (keyData) {
        privateKey = await CryptoService.decryptPrivateKey(
          keyData.encrypted_private_key,
          vaultKey
        );
      }

      setState(s => ({
        ...s,
        vault: { isLocked: false, isInitialized: true, vaultKey, privateKey },
      }));

      return { error: null };
    } catch (err) {
      return { error: 'Invalid passphrase or corrupted vault data' };
    }
  };

  const lockVault = () => {
    setState(s => ({
      ...s,
      vault: { isLocked: true, isInitialized: s.vault.isInitialized, vaultKey: null, privateKey: null },
    }));
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!state.user) return { error: 'Not authenticated' };
    const { error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', state.user.id);
    if (!error) await fetchProfile(state.user.id);
    return { error: error?.message ?? null };
  };

  const refreshProfile = async () => {
    if (state.user) await fetchProfile(state.user.id);
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      unlockVault,
      lockVault,
      setupVault,
      updateProfile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
