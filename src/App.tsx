import React, { lazy, Suspense, useState, useEffect, type ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/stores/AuthContext';
import { WorkspaceProvider, useWorkspace } from '@/stores/WorkspaceContext';
import { supabase } from '@/lib/supabase/client';
import { CryptoService } from '@/lib/crypto/cryptoService';
import { isSupabaseConfigured } from '@/lib/supabase/client';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const ConnectionStatusLazy = lazy(() => import('@/components/ConnectionStatus'));
const DatabaseSetupGuideLazy = lazy(() => import('@/components/DatabaseSetupGuide'));
import {
  LayoutDashboard, FolderKanban, Shield, GitBranch, CheckSquare, Users,
  Settings, LogOut, Lock, Unlock, ChevronLeft, ChevronRight, Bell,
  Search, Plus, Globe, Key, FileText, Activity, Server, Package,
  Lock as LockIcon, Unlock as UnlockIcon, AlertTriangle, CheckCircle,
  Clock, ArrowRight, Menu, X, Moon, Sun, Zap, Database, Code2,
  Trash2, Edit, Copy, Eye, EyeOff, Download, Upload
} from 'lucide-react';

const LandingPage = lazy(() => import('@/pages/LandingPage'));

// ─── Loading Screen ─────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading DevPortal...</p>
      </div>
    </div>
  );
}

// ─── Protected Route ────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ─── Login Page ─────────────────────────────────────────────────────
function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">DevPortal</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Internal Developer Portal</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Sign in</h2>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="you@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <div className="mt-6 flex items-center justify-between text-sm">
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline">Create account</Link>
            <Link to="/forgot-password" className="text-slate-500 dark:text-slate-400 hover:underline">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Register Page ──────────────────────────────────────────────────
function RegisterPage() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (user) navigate('/onboarding'); }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return; }
    const { error } = await signUp(email, password, fullName);
    if (error) setError(error);
    else setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Account</h1>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-700 dark:text-slate-300">Check your email to verify your account, then sign in.</p>
              <Link to="/login" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline">Go to login</Link>
            </div>
          ) : (
            <>
              {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50">
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
              <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding Page ────────────────────────────────────────────────
function OnboardingPage() {
  const { user, setupVault, isOnboarded } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [savedRecovery, setSavedRecovery] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isOnboarded) navigate('/dashboard'); }, [isOnboarded, navigate]);

  const handleSetupVault = async () => {
    if (passphrase.length < 12) { setError('Passphrase must be at least 12 characters'); return; }
    if (passphrase !== confirmPassphrase) { setError('Passphrases do not match'); return; }
    setLoading(true);
    setError('');
    const { error, recoveryKey: key } = await setupVault(passphrase);
    if (error) { setError(error); setLoading(false); return; }
    if (key) setRecoveryKey(key);
    setStep(3);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vault Setup</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Step {step} of 3</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Vault Passphrase</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This passphrase encrypts your vault key. It is separate from your account password.
              </p>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>If you forget this passphrase and lose your recovery key, your encrypted data will be permanently inaccessible.</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vault Passphrase (min 12 chars)</label>
                <input type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Passphrase</label>
                <input type="password" value={confirmPassphrase} onChange={e => setConfirmPassphrase(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button onClick={() => { if (passphrase.length >= 12 && passphrase === confirmPassphrase) setStep(2); else setError('Please meet requirements'); }}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition">
                Continue
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Initialize Encrypted Vault</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This will generate your encryption keys and set up your secure vault.
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button onClick={handleSetupVault} disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50">
                {loading ? 'Generating keys...' : 'Create Vault'}
              </button>
              <button onClick={() => setStep(1)} className="w-full py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium transition hover:bg-slate-50 dark:hover:bg-slate-800">
                Back
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Save Your Recovery Key</h2>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Save this key in a secure location. It is the only way to recover your vault if you forget your passphrase.</span>
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-sm break-all text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                {recoveryKey}
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={savedRecovery} onChange={e => setSavedRecovery(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600" />
                I have saved my recovery key in a secure location
              </label>
              <button onClick={() => navigate('/dashboard')} disabled={!savedRecovery}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50">
                Complete Setup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();
  const { vault, lockVault, unlockVault, signOut } = useAuth();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/workspaces', icon: Globe, label: 'Workspaces' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/environments', icon: Server, label: 'Environments' },
    { path: '/branches', icon: GitBranch, label: 'Branches' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/members', icon: Users, label: 'Members' },
    { path: '/integrations', icon: Zap, label: 'Integrations' },
    { path: '/activity', icon: Activity, label: 'Activity' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleUnlock = async () => {
    setUnlocking(true);
    setUnlockError('');
    const { error } = await unlockVault(passphrase);
    if (error) setUnlockError(error);
    else { setShowUnlockModal(false); setPassphrase(''); }
    setUnlocking(false);
  };

  return (
    <>
      <aside className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-40 flex flex-col ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">DevPortal</span>
            </div>
          )}
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className={`w-2 h-2 rounded-full ${vault.isLocked ? 'bg-amber-500' : 'bg-green-500'}`} />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Vault: {vault.isLocked ? 'Locked' : 'Unlocked'}
              </span>
            </div>
          )}
          <button onClick={() => vault.isLocked ? setShowUnlockModal(true) : lockVault()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg w-full transition text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            {vault.isLocked ? <Unlock className="w-5 h-5 shrink-0" /> : <Lock className="w-5 h-5 shrink-0" />}
            {!collapsed && <span className="text-sm">{vault.isLocked ? 'Unlock Vault' : 'Lock Vault'}</span>}
          </button>
          <button onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg w-full transition text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950">
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm">Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Vault Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200 dark:border-slate-800">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unlock Vault</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your vault passphrase</p>
            </div>
            {unlockError && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{unlockError}</div>}
            <div className="space-y-4">
              <input type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter your vault passphrase" autoFocus />
              <button onClick={handleUnlock} disabled={unlocking || !passphrase}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50">
                {unlocking ? 'Unlocking...' : 'Unlock'}
              </button>
              <button onClick={() => setShowUnlockModal(false)} className="w-full py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium transition hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── App Layout ─────────────────────────────────────────────────────
function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 ${darkMode ? 'dark' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 relative">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

// ─── Dashboard Page ─────────────────────────────────────────────────
function DashboardPage() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ projects: 0, tasks: 0, workspaces: 0, members: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const [workspacesRes, projectsRes, tasksRes] = await Promise.all([
        supabase.from('workspaces').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        workspaces: workspacesRes.count || 0,
        projects: projectsRes.count || 0,
        tasks: tasksRes.count || 0,
        members: 1,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Projects', value: stats.projects, icon: FolderKanban, color: 'from-blue-500 to-blue-600' },
    { label: 'Tasks', value: stats.tasks, icon: CheckSquare, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Workspaces', value: stats.workspaces, icon: Globe, color: 'from-purple-500 to-purple-600' },
    { label: 'Members', value: stats.members, icon: Users, color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your development overview</p>
        </div>
        <Link to="/projects" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
          <Plus className="w-4 h-4" /> New Project
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '-' : card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/workspaces" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <Globe className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Create Workspace</span>
            </Link>
            <Link to="/projects" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <FolderKanban className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Create Project</span>
            </Link>
            <Link to="/tasks" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <CheckSquare className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Create Task</span>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Security Status</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Vault</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Encryption keys loaded</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">RLS Policies</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Database access control enabled</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State Component ──────────────────────────────────────────
function EmptyState({ icon: Icon, title, description, action }: { icon: any; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-sm font-medium text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Workspaces Page ────────────────────────────────────────────────
function WorkspacesPage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadWorkspaces(); }, []);

  const loadWorkspaces = async () => {
    const { data, error } = await supabase.from('workspaces').select('*').order('created_at', { ascending: false });
    if (!error && data) setWorkspaces(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!name || !user) return;
    setCreating(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { data, error } = await supabase.from('workspaces').insert({
      name, slug, description: description || null, owner_id: user.id
    }).select().single();
    
    if (!error && data) {
      // Add owner as member
      await supabase.from('workspace_members').insert({
        workspace_id: data.id, user_id: user.id, role: 'owner'
      });
      setWorkspaces([data, ...workspaces]);
      setShowCreate(false);
      setName('');
      setDescription('');
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workspaces</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your team workspaces</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
          <Plus className="w-4 h-4" /> New Workspace
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Create Workspace</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleCreate} disabled={creating || !name} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50">
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : workspaces.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <EmptyState icon={Globe} title="No workspaces yet" description="Create a workspace to organize your projects and team" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map(ws => (
            <div key={ws.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">Active</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mt-3">{ws.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{ws.description || 'No description'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Projects Page ──────────────────────────────────────────────────
function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
    loadWorkspaces();
  }, []);

  const loadProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (!error && data) setProjects(data);
    setLoading(false);
  };

  const loadWorkspaces = async () => {
    const { data } = await supabase.from('workspaces').select('id, name');
    if (data) setWorkspaces(data);
  };

  const handleCreate = async () => {
    if (!name || !user || !workspaceId) return;
    setCreating(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { data, error } = await supabase.from('projects').insert({
      workspace_id: workspaceId, name, slug, description: description || null, owner_id: user.id
    }).select().single();
    
    if (!error && data) {
      // Add owner as project member
      await supabase.from('project_members').insert({
        project_id: data.id, user_id: user.id, role: 'owner'
      });
      // Create default environments
      const envTypes = ['development', 'testing', 'staging', 'production'];
      for (const type of envTypes) {
        await supabase.from('environments').insert({
          project_id: data.id, name: type.charAt(0).toUpperCase() + type.slice(1), type
        });
      }
      setProjects([data, ...projects]);
      setShowCreate(false);
      setName('');
      setDescription('');
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your software projects</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Create Project</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Workspace</label>
              <select value={workspaceId} onChange={e => setWorkspaceId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select workspace</option>
                {workspaces.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleCreate} disabled={creating || !name || !workspaceId} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50">
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <EmptyState icon={FolderKanban} title="No projects yet" description="Create a project to start managing environments, secrets, and tasks" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 capitalize">{project.status}</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mt-3">{project.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{project.description || 'No description'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Forgot Password Page ───────────────────────────────────────────
function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await resetPassword(email);
    if (error) setError(error);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset Password</h1>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-700 dark:text-slate-300">Check your email for a password reset link.</p>
              <Link to="/login" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline">Back to login</Link>
            </div>
          ) : (
            <>
              {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{error}</div>}
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <p className="mt-4 text-center text-sm">
                <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Simple placeholder pages for other routes ──────────────────────
function EnvironmentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Environments</h1>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <EmptyState icon={Server} title="Environment management" description="Select a project to manage environments and encrypted secrets" />
      </div>
    </div>
  );
}

function BranchesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Branches</h1>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <EmptyState icon={GitBranch} title="Branch tracking" description="Track repository branches and commits" />
      </div>
    </div>
  );
}

function TasksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <EmptyState icon={CheckSquare} title="Task management" description="Create and track project tasks" />
      </div>
    </div>
  );
}

function MembersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Members</h1>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <EmptyState icon={Users} title="Team members" description="Manage workspace and project members" />
      </div>
    </div>
  );
}

function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Integrations</h1>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <EmptyState icon={Zap} title="Integrations" description="Connect external services to your projects" />
      </div>
    </div>
  );
}

function ActivityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity</h1>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <EmptyState icon={Activity} title="Activity log" description="View recent actions and security events" />
      </div>
    </div>
  );
}

function SettingsPage() {
  const { profile, vault, lockVault, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [message, setMessage] = useState('');

  const handleUpdate = async () => {
    const { error } = await updateProfile({ full_name: fullName });
    setMessage(error ? `Error: ${error}` : 'Profile updated');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
      {message && <div className={`p-3 rounded-lg text-sm ${message.startsWith('Error') ? 'bg-red-50 dark:bg-red-950 text-red-700' : 'bg-green-50 dark:bg-green-950 text-green-700'}`}>{message}</div>}
      
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input value={profile?.email || ''} disabled className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={handleUpdate} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">Save Changes</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Vault & Security</h2>
        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            {vault.isLocked ? <LockIcon className="w-5 h-5 text-amber-500" /> : <UnlockIcon className="w-5 h-5 text-green-500" />}
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Vault Status</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{vault.isLocked ? 'Locked' : 'Unlocked'}</p>
            </div>
          </div>
          <button onClick={vault.isLocked ? () => {} : lockVault}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${vault.isLocked ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'}`}>
            {vault.isLocked ? 'Unlock' : 'Lock'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── App Router ─────────────────────────────────────────────────────
function AppRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Routes>
      {!user && <Route path="/" element={<Suspense fallback={<LoadingScreen />}><LandingPage /></Suspense>} />}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/workspaces" element={<ProtectedRoute><AppLayout><WorkspacesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><AppLayout><ProjectsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/environments" element={<ProtectedRoute><AppLayout><EnvironmentsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/branches" element={<ProtectedRoute><AppLayout><BranchesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><AppLayout><TasksPage /></AppLayout></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><AppLayout><MembersPage /></AppLayout></ProtectedRoute>} />
      <Route path="/integrations" element={<ProtectedRoute><AppLayout><IntegrationsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute><AppLayout><ActivityPage /></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
      {user && <Route path="/" element={<Navigate to="/dashboard" replace />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─── Root App ───────────────────────────────────────────────────────
function SupabaseConfigurationRequired() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <section className="w-full max-w-xl rounded-2xl border border-amber-200 bg-white p-8 shadow-xl dark:border-amber-900 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Authentication is not configured</h1>
        </div>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          Sign-up and sign-in are unavailable until this site is connected to a Supabase project.
          Add the following GitHub repository variables, then run the Pages deployment again:
        </p>
        <ul className="my-4 list-disc space-y-2 pl-6 text-sm text-slate-700 dark:text-slate-200">
          <li><code>VITE_SUPABASE_URL</code> - your Supabase project URL</li>
          <li><code>VITE_SUPABASE_PUBLISHABLE_KEY</code> - your Supabase publishable (anon) key</li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/DummyMe-one/IDP/settings/variables/actions"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Configure repository variables
          </a>
          <a
            href="https://github.com/DummyMe-one/IDP/blob/main/docs/SUPABASE-SETUP.md"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Supabase setup guide
          </a>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  if (!isSupabaseConfigured) return <SupabaseConfigurationRequired />;

  return (
    <AuthProvider>
      <WorkspaceProvider>
        <HashRouter>
          <AppRouter />
        </HashRouter>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
