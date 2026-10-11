import React, { lazy, Suspense, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/stores/AuthContext';
import { WorkspaceProvider, useWorkspace } from '@/stores/WorkspaceContext';
import { CryptoService } from '@/lib/crypto/cryptoService';
import { parseEnvFile, generateEnvFile, downloadEnvFile, type ParsedEnvEntry } from '@/lib/utils/envParser';
import {
  createProject,
  createWorkspace,
  updateWorkspace,
  archiveWorkspace,
  updateProject,
  archiveProject,
  deleteProject,
  getEnvironments,
  getSecrets,
  getProjectSecretCounts,
  createSecret,
  deleteSecret,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getWorkspaceMembers,
  createInvitation,
  getPendingInvitations,
  revokeInvitation,
  updateMemberRole,
  removeWorkspaceMember,
  getProjectIntegrations,
  updateIntegrationStatus,
  getAuditEvents,
} from '@/services/api';
import type {
  Project,
  Environment,
  EncryptedSecret,
  Branch,
  Task,
  TaskStatus,
  TaskPriority,
  UserRole,
  WorkspaceMember,
  WorkspaceInvitation,
  IntegrationConnection,
  AuditEvent,
  Profile,
} from '@/types';
import {
  LayoutDashboard,
  FolderKanban,
  Shield,
  GitBranch,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Plus,
  Globe,
  Key,
  FileText,
  Activity,
  Server,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Menu,
  X,
  Moon,
  Sun,
  Zap,
  Database,
  Code2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Layers,
  Filter,
  Edit3,
  Archive,
} from 'lucide-react';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const ConnectionStatusLazy = lazy(() => import('@/components/ConnectionStatus'));
const DatabaseSetupGuideLazy = lazy(() => import('@/components/DatabaseSetupGuide'));

// ─── Protected Route ────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/25">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading DevPortal...</p>
      </div>
    </div>
  );
}

// ─── Auth Pages ─────────────────────────────────────────────────────
function LoginPage() {
  const { signIn, signInDemo, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: signInError } = await signIn(email, password);
    if (signInError) setError(signInError);
    else navigate('/dashboard');
    setLoading(false);
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    setError('');
    const { error: demoErr } = await signInDemo();
    if (demoErr) setError(demoErr);
    else navigate('/dashboard');
    setDemoLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/25">
            <Shield className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back to DevPortal</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Zero-Knowledge Internal Developer Portal</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 p-8 border border-slate-200 dark:border-slate-800">
          <div className="mb-6">
            <button
              type="button"
              onClick={handleDemo}
              disabled={demoLoading || loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {demoLoading ? 'Launching Demo Workspace...' : 'Quick Demo Access (Unlocked Vault + Sample Data)'}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">or sign in with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-medium transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Create new account
            </Link>
            <Link to="/forgot-password" className="text-slate-500 dark:text-slate-400 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterPage() {
  const { signUp, signInDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }
    const { error: signUpErr } = await signUp(email, password, fullName);
    if (signUpErr) {
      setError(signUpErr);
      setLoading(false);
    } else {
      navigate('/onboarding');
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    await signInDemo();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/25">
            <Shield className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Your Developer Account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Includes isolated workspace, projects & zero-knowledge vault
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 p-8 border border-slate-200 dark:border-slate-800">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="Jane Doe"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="jane@company.com"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Password (min 8 chars)</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50 shadow-lg shadow-indigo-500/25"
            >
              {loading ? 'Creating account & workspace...' : 'Create Account & Continue'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleDemo}
              className="w-full py-2 px-4 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Or try instant Demo Workspace without registration
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function OnboardingPage() {
  const { setupVault, isOnboarded } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [savedRecovery, setSavedRecovery] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOnboarded && step !== 3) navigate('/dashboard');
  }, [isOnboarded, step, navigate]);

  const handleSetupVault = async () => {
    if (passphrase.length < 12) {
      setError('Passphrase must be at least 12 characters');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError('Passphrases do not match');
      return;
    }
    setLoading(true);
    setError('');
    const { error: setupErr, recoveryKey: key } = await setupVault(passphrase);
    if (setupErr) {
      setError(setupErr);
      setLoading(false);
      return;
    }
    if (key) setRecoveryKey(key);
    setStep(3);
    setLoading(false);
  };

  const handleCopyRecovery = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopiedRecovery(true);
    setTimeout(() => setCopiedRecovery(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Zero-Knowledge Vault Setup</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Step {step} of 3 — Client-Side AES-256-GCM + RSA-4096</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Vault Passphrase</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This passphrase derives your Key Encryption Key (PBKDF2 600K iterations) in your browser. It is separate from your login password.
              </p>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>If you forget this passphrase and lose your recovery key, your encrypted secrets cannot be decrypted.</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Vault Passphrase (min 12 chars)
                </label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={e => setPassphrase(e.target.value)}
                  placeholder="Enter a strong 12+ character passphrase"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className={passphrase.length >= 12 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                    {passphrase.length}/12 minimum characters
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Passphrase
                </label>
                <input
                  type="password"
                  value={confirmPassphrase}
                  onChange={e => setConfirmPassphrase(e.target.value)}
                  placeholder="Re-enter your vault passphrase"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => {
                    if (passphrase.length < 12) {
                      setError('Passphrase must be at least 12 characters');
                      return;
                    }
                    if (passphrase !== confirmPassphrase) {
                      setError('Passphrases do not match');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Generate Cryptographic Keys</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your browser will now generate a 256-bit AES-GCM Vault Key, a 4096-bit RSA-OAEP keypair, and an encrypted recovery bundle.
              </p>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <button
                onClick={handleSetupVault}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50"
              >
                {loading ? 'Generating 4096-bit RSA & AES Keys...' : 'Initialize Encrypted Vault'}
              </button>
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Back
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Save Your Recovery Key</h2>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-800 dark:text-red-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Copy and store this recovery key in a safe place. It is the only way to recover your vault if you forget your passphrase.</span>
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-sm break-all text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <span>{recoveryKey}</span>
                <button
                  type="button"
                  onClick={handleCopyRecovery}
                  className="px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-sans font-medium flex items-center gap-1 shrink-0 hover:bg-slate-50"
                >
                  {copiedRecovery ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedRecovery ? 'Copied' : 'Copy'}
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={savedRecovery}
                  onChange={e => setSavedRecovery(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
                I have saved my recovery key in a secure location
              </label>
              <button
                onClick={() => navigate('/dashboard')}
                disabled={!savedRecovery}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50"
              >
                Enter DevPortal Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────
function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { vault, lockVault, openVaultModal, signOut, profile } = useAuth();
  const { activeWorkspace } = useWorkspace();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/workspaces', icon: Globe, label: 'Workspaces' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/environments', icon: Server, label: 'Environments & Secrets' },
    { path: '/branches', icon: GitBranch, label: 'Branches' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks Board' },
    { path: '/members', icon: Users, label: 'Team Members' },
    { path: '/integrations', icon: Zap, label: 'Integrations' },
    { path: '/activity', icon: Activity, label: 'Audit Activity' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleVaultButton = () => {
    if (!vault.isInitialized) {
      navigate('/onboarding');
      return;
    }
    if (vault.isLocked) {
      openVaultModal();
    } else {
      lockVault();
    }
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-40 flex flex-col ${
          collapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block leading-none">DevPortal</span>
                <span className="text-[10px] text-slate-400 font-medium">Internal Developer Portal</span>
              </div>
            </Link>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hidden lg:inline-flex"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive =
              location.pathname === item.path ||
              (item.path === '/dashboard' && location.pathname === '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition font-medium text-sm ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {!collapsed && profile && (
            <div className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {profile.full_name || profile.email}
                </p>
                {activeWorkspace && (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                    {activeWorkspace.member_role}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{profile.email}</p>
            </div>
          )}

          <button
            onClick={handleVaultButton}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl w-full transition text-xs font-medium border ${
              !vault.isInitialized
                ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                : vault.isLocked
                  ? 'border-amber-200 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100/70'
                  : 'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70'
            }`}
          >
            {vault.isLocked ? <Lock className="w-4 h-4 shrink-0" /> : <Unlock className="w-4 h-4 shrink-0" />}
            {!collapsed && (
              <span className="truncate">
                {!vault.isInitialized
                  ? 'Initialize Vault'
                  : vault.isLocked
                    ? 'Vault Locked (Click to Unlock)'
                    : 'Vault Unlocked (Click to Lock)'}
              </span>
            )}
          </button>

          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-xl w-full transition text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Main Layout with Global Workspace & Project Switchers ──────────
function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([]);

  const navigate = useNavigate();
  const { vault, openVaultModal, lockVault } = useAuth();
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    projects,
    activeProject,
    setActiveProject,
  } = useWorkspace();

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (showNotifications && activeWorkspace) {
      getAuditEvents(activeWorkspace.id, 8).then(setRecentEvents).catch(() => {});
    }
  }, [showNotifications, activeWorkspace]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return projects.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const quickNavMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const pages = [
      { label: 'Dashboard Overview', path: '/dashboard' },
      { label: 'Workspaces Management', path: '/workspaces' },
      { label: 'Projects Directory', path: '/projects' },
      { label: 'Environments & Encrypted Secrets', path: '/environments' },
      { label: 'Branches & Commits', path: '/branches' },
      { label: 'Tasks & Kanban Board', path: '/tasks' },
      { label: 'Team Members & Invitations', path: '/members' },
      { label: 'External Integrations', path: '/integrations' },
      { label: 'Security Audit Activity', path: '/activity' },
      { label: 'Account & Vault Settings', path: '/settings' },
    ];
    return pages.filter(p => p.label.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 ${darkMode ? 'dark' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6 py-3">
            {/* Left: Mobile Menu + Global Workspace & Project Switchers */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Workspace Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Workspace:</span>
                <select
                  aria-label="Select active workspace"
                  value={activeWorkspace?.id || ''}
                  onChange={e => {
                    const found = workspaces.find(w => w.id === e.target.value) || null;
                    setActiveWorkspace(found);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer max-w-[140px] sm:max-w-[180px] truncate"
                >
                  {workspaces.length === 0 && <option value="">No Workspace</option>}
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>

              {/* Active Project Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Project:</span>
                <select
                  aria-label="Select active project"
                  value={activeProject?.id || ''}
                  onChange={e => {
                    const found = projects.find(p => p.id === e.target.value) || null;
                    setActiveProject(found);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer max-w-[140px] sm:max-w-[180px] truncate"
                >
                  {projects.length === 0 && <option value="">No Project</option>}
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {proj.name}
                    </option>
                  ))}
                </select>
                {activeProject && (
                  <Link
                    to={`/projects?edit=${activeProject.id}`}
                    title={`Edit Project (${activeProject.name})`}
                    className="p-0.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Link>
                )}
                <Link
                  to="/projects?new=1"
                  title="Create New Project"
                  className="p-0.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right: Search + Vault Badge + Notifications + Dark Mode */}
            <div className="flex items-center gap-2.5">
              {/* Global Search */}
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 180)}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  placeholder="Jump to project or page..."
                  className="pl-9 pr-4 py-1.5 w-56 lg:w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
                {showSearchDropdown && searchQuery.trim() && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 space-y-2">
                    {filteredProjects.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Projects
                        </p>
                        {filteredProjects.map(p => (
                          <button
                            key={p.id}
                            onMouseDown={() => {
                              setActiveProject(p);
                              setSearchQuery('');
                              navigate('/projects');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Select →</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {quickNavMatches.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Portal Pages
                        </p>
                        {quickNavMatches.map(item => (
                          <button
                            key={item.path}
                            onMouseDown={() => {
                              setSearchQuery('');
                              navigate(item.path);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {filteredProjects.length === 0 && quickNavMatches.length === 0 && (
                      <p className="text-xs text-slate-400 px-2 py-3 text-center">No matching projects or pages</p>
                    )}
                  </div>
                )}
              </div>

              {/* Vault Quick Button */}
              <button
                onClick={() => (vault.isLocked ? openVaultModal() : lockVault())}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border ${
                  vault.isLocked
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                {vault.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{vault.isLocked ? 'Unlock Vault' : 'Vault Unlocked'}</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                title="Toggle color theme"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Audit Activity Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 relative"
                  title="Recent security & audit activity"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">Recent Audit Events</span>
                      <Link
                        to="/activity"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recentEvents.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">No recent events</p>
                      ) : (
                        recentEvents.map(ev => (
                          <div
                            key={ev.id}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-xs flex items-start justify-between gap-2"
                          >
                            <div>
                              <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{ev.action}</p>
                              <p className="text-[11px] text-slate-400">{ev.resource_type}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

// ─── Dashboard Page (Fully Dynamic & Data-Driven) ───────────────────
function DashboardPage() {
  const { profile, vault, openVaultModal } = useAuth();
  const { workspaces, activeWorkspace, projects, activeProject, setActiveProject } = useWorkspace();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<(WorkspaceMember & { profile: Profile | null })[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [secretCount, setSecretCount] = useState(0);

  useEffect(() => {
    if (!activeWorkspace) return;
    getTasks(activeProject?.id, undefined, activeWorkspace.id).then(setTasks).catch(() => {});
    getWorkspaceMembers(activeWorkspace.id).then(setMembers).catch(() => {});
    getAuditEvents(activeWorkspace.id, 6).then(setAuditEvents).catch(() => {});
  }, [activeWorkspace, activeProject]);

  useEffect(() => {
    if (!activeProject) {
      setSecretCount(0);
      return;
    }
    getProjectSecretCounts(activeProject.id)
      .then(counts => {
        const total = Object.values(counts).reduce((acc, n) => acc + n, 0);
        setSecretCount(total);
      })
      .catch(() => {});
  }, [activeProject]);

  const openTasks = tasks.filter(t => t.status !== 'done');
  const upcomingDeadlines = tasks
    .filter(t => t.due_date && t.status !== 'done')
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    .slice(0, 5);

  const statCards = [
    {
      label: 'Active Projects',
      value: projects.filter(p => p.status === 'active').length,
      sub: `${projects.length} total in workspace`,
      icon: FolderKanban,
      color: 'from-indigo-500 to-indigo-600',
      link: '/projects',
    },
    {
      label: 'Open Tasks',
      value: openTasks.length,
      sub: `${tasks.filter(t => t.status === 'done').length} completed`,
      icon: CheckSquare,
      color: 'from-emerald-500 to-emerald-600',
      link: '/tasks',
    },
    {
      label: 'Encrypted Secrets',
      value: secretCount,
      sub: activeProject ? `in ${activeProject.name}` : 'Select a project',
      icon: Key,
      color: 'from-purple-500 to-purple-600',
      link: '/environments',
    },
    {
      label: 'Team Members',
      value: members.length,
      sub: `${workspaces.length} workspace(s)`,
      icon: Users,
      color: 'from-amber-500 to-amber-600',
      link: '/members',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {activeWorkspace
              ? `Workspace: ${activeWorkspace.name} · Active Project: ${activeProject?.name || 'None selected'}`
              : 'Select or create a workspace to begin'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/environments"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Key className="w-3.5 h-3.5 text-indigo-500" /> Manage Secrets
          </Link>
          <Link
            to="/projects?new=1"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" /> New Project
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Link
            key={card.label}
            to={card.link}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
                <p className="text-[11px] text-slate-400 mt-1">{card.sub}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Active Project Spotlight */}
      {activeProject && (
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-medium mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Active Project Context
              </div>
              <h2 className="text-xl font-bold">{activeProject.name}</h2>
              <p className="text-sm text-indigo-100 mt-1">
                {activeProject.description || 'Zero-knowledge encrypted software project'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate('/environments')}
                className="px-3.5 py-2 rounded-xl bg-white text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition flex items-center gap-1.5"
              >
                <Server className="w-3.5 h-3.5" /> Environments & Secrets
              </button>
              <button
                onClick={() => navigate('/tasks')}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition flex items-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5" /> Tasks Board
              </button>
              <button
                onClick={() => navigate('/branches')}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition flex items-center gap-1.5"
              >
                <GitBranch className="w-3.5 h-3.5" /> Branches
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Workspace Projects</h2>
              <p className="text-xs text-slate-400">Click any project to switch active context</p>
            </div>
            <Link to="/projects" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              Manage all →
            </Link>
          </div>
          <div className="p-5">
            {projects.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No projects in this workspace"
                description="Create your first project to auto-provision Development, Testing, Staging, and Production environments."
                action={
                  <Link
                    to="/projects?new=1"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Project
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map(proj => {
                  const isSelected = activeProject?.id === proj.id;
                  return (
                    <div
                      key={proj.id}
                      onClick={() => setActiveProject(proj)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {proj.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-medium">
                              Active
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                            {proj.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {proj.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setActiveProject(proj);
                            navigate('/environments');
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Secrets
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setActiveProject(proj);
                            navigate('/tasks');
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Tasks
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
            <Link to="/activity" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              Audit Log →
            </Link>
          </div>
          <div className="p-5">
            {auditEvents.length === 0 ? (
              <EmptyState icon={Activity} title="No activity yet" description="Actions will be logged here automatically" />
            ) : (
              <div className="space-y-3">
                {auditEvents.map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-medium text-slate-900 dark:text-white truncate">{ev.action}</p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {ev.actor?.full_name || 'User'} · {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Upcoming Task Deadlines</h2>
            <Link to="/tasks" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              Open Board →
            </Link>
          </div>
          <div className="p-5">
            {upcomingDeadlines.length === 0 ? (
              <EmptyState icon={Clock} title="No upcoming deadlines" description="Assign due dates to tasks to track them here" />
            ) : (
              <div className="space-y-2.5">
                {upcomingDeadlines.map(t => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{t.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        Status: {t.status.replace('_', ' ')} · Priority: {t.priority}
                      </p>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                      Due {t.due_date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security & Vault Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Zero-Knowledge Security Status</h2>
            {vault.isLocked && (
              <button
                onClick={openVaultModal}
                className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
              >
                Unlock Vault
              </button>
            )}
          </div>
          <div className="p-5 space-y-3.5">
            <SecurityStatusItem
              label="Client-Side Vault (AES-256-GCM)"
              status={vault.isLocked ? 'warning' : 'active'}
              description={
                vault.isLocked
                  ? 'Vault is currently locked — unlock to encrypt or reveal secrets'
                  : 'Vault unlocked in memory — ready for zero-knowledge encryption'
              }
            />
            <SecurityStatusItem
              label="User-Scoped Workspace Isolation"
              status="active"
              description="All projects, environments, secrets, and tasks are isolated per user & workspace"
            />
            <SecurityStatusItem
              label="PBKDF2 Key Derivation + RSA-OAEP-4096"
              status="active"
              description="600,000 iterations SHA-256 key derivation with 4096-bit asymmetric wrapping"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityStatusItem({
  label,
  status,
  description,
}: {
  label: string;
  status: 'active' | 'warning' | 'error';
  description: string;
}) {
  const colors = { active: 'bg-emerald-500', warning: 'bg-amber-500', error: 'bg-red-500' };
  return (
    <div className="flex items-start gap-3">
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${colors[status]}`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

// ─── Workspaces Page ────────────────────────────────────────────────
function WorkspacesPage() {
  const { user } = useAuth();
  const { workspaces, activeWorkspace, isLoading, loadError, refresh, setActiveWorkspace } = useWorkspace();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !name.trim()) return;

    setSaving(true);
    setError('');
    try {
      const workspace = await createWorkspace(name.trim(), description.trim() || null, user.id);
      await refresh();
      setActiveWorkspace({ ...workspace, member_role: 'owner' });
      setName('');
      setDescription('');
      setShowCreate(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create workspace.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (wsId: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateWorkspace(wsId, { name: editName.trim(), description: editDesc.trim() || null });
      await refresh();
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (wsId: string) => {
    if (!user || workspaces.length <= 1) return;
    await archiveWorkspace(wsId, user.id);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workspaces</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Top-level organization, client, or department containers that group your projects, team RBAC, and audit logs
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> New Workspace
        </button>
      </div>

      {/* Hierarchy Explainer Banner */}
      <div className="rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Why do we create Workspaces vs. Projects?
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                A <strong>Workspace</strong> represents a <strong>Company, Client, or Engineering Team</strong> (e.g., <em>Shivam Electronics</em>) where team members and permissions live. Inside a Workspace, you create multiple <strong>Projects</strong>—one for each GitHub repository, app, or microservice (e.g., <em>Landing Website</em>, <em>Admin API</em>, <em>Mobile App</em>), each with its own 4 environments and encrypted secrets.
              </p>
            </div>
          </div>
          <Link
            to="/projects"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50"
          >
            View Workspace Projects <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-md"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Create New Workspace</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Workspace Name</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Shivam Electronics or Platform Engineering"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Core backend services, client apps, and infrastructure"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {error && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loadError && <p role="alert" className="col-span-full text-sm text-red-600 dark:text-red-400">{loadError}</p>}
        {isLoading ? (
          <p className="col-span-full text-sm text-slate-500">Loading workspaces...</p>
        ) : workspaces.length === 0 ? (
          <div className="col-span-full">
            <EmptyState icon={Globe} title="No workspaces" description="Create a workspace to organize your projects and team" />
          </div>
        ) : (
          workspaces.map(ws => {
            const isSelected = activeWorkspace?.id === ws.id;
            const isEditing = editingId === ws.id;
            return (
              <div
                key={ws.id}
                onClick={() => !isEditing && setActiveWorkspace(ws)}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 transition cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-medium">
                        Active
                      </span>
                    )}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                      {ws.member_role}
                    </span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Workspace Name
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="mt-1 w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Description
                      <input
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        placeholder="Description"
                        className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(ws.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-slate-900 dark:text-white mt-3">{ws.name}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">/{ws.slug}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {ws.description || 'No description provided'}
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        {isSelected ? 'Currently Selected' : 'Click to Activate →'}
                      </span>
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(ws.id);
                            setEditName(ws.name);
                            setEditDesc(ws.description || '');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300"
                          title="Edit workspace name and description"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        {workspaces.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleArchive(ws.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-600"
                            title="Archive workspace"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Helper to normalize deep GitHub/GitLab file URLs (e.g., /blob/main/... or /tree/main/...) to the repository root
function extractRepositoryRootUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes('github.com') || parsed.hostname.includes('gitlab.com')) {
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length >= 2) {
        const rootPath = `/${segments[0]}/${segments[1].replace(/\.git$/, '')}`;
        const candidate = `${parsed.origin}${rootPath}`;
        if (candidate !== trimmed.replace(/\/$/, '')) {
          return candidate;
        }
      }
    }
  } catch {
    // Ignore invalid URL
  }
  return null;
}

// ─── Projects Page (Full Lifecycle, Edit Modal & Active Context Selection) ─────
function ProjectsPage() {
  const { user } = useAuth();
  const {
    workspaces,
    activeWorkspace,
    projects,
    activeProject,
    setActiveProject,
    isLoading: workspacesLoading,
    projectsLoading,
    loadError: workspacesError,
    refreshProjects,
  } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();

  const [showCreate, setShowCreate] = useState(() => location.search.includes('new=1'));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'archived'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit Project state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRepositoryUrl, setEditRepositoryUrl] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'paused' | 'archived'>('active');
  const [editWorkspaceId, setEditWorkspaceId] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const openEditProject = (project: Project) => {
    setShowCreate(false);
    setEditingProject(project);
    setEditName(project.name);
    setEditSlug(project.slug);
    setEditDescription(project.description || '');
    setEditRepositoryUrl(project.repository_url || '');
    setEditStatus(project.status);
    setEditWorkspaceId(project.workspace_id);
    setEditError('');
  };

  useEffect(() => {
    if (location.search.includes('new=1')) {
      setShowCreate(true);
      setEditingProject(null);
    } else if (location.search.includes('edit=')) {
      const params = new URLSearchParams(location.search);
      const editId = params.get('edit');
      const target = projects.find(p => p.id === editId) || activeProject;
      if (target) {
        openEditProject(target);
      }
    }
  }, [location.search, projects, activeProject]);

  const handleSaveEditProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingProject || !editName.trim()) return;

    setEditSaving(true);
    setEditError('');
    try {
      const normalizedSlug =
        editSlug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') ||
        editName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

      const updated = await updateProject(
        editingProject.id,
        {
          name: editName.trim(),
          slug: normalizedSlug,
          description: editDescription.trim() || null,
          repository_url: editRepositoryUrl.trim() || null,
          status: editStatus,
          workspace_id: editWorkspaceId || editingProject.workspace_id,
        },
        user?.id
      );

      await refreshProjects(updated.id);
      if (activeProject?.id === updated.id) {
        setActiveProject(updated);
      }
      setEditingProject(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update project.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !activeWorkspace || !name.trim()) return;

    setSaving(true);
    setError('');
    try {
      const project = await createProject(
        activeWorkspace.id,
        name.trim(),
        description.trim() || null,
        repositoryUrl.trim() || null,
        user.id
      );
      await refreshProjects(project.id);
      setActiveProject(project);
      setName('');
      setDescription('');
      setRepositoryUrl('');
      setShowCreate(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create project.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (projectId: string, currentStatus: 'active' | 'paused' | 'archived') => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    await updateProject(projectId, { status: nextStatus }, user?.id);
    await refreshProjects();
  };

  const handleArchiveProject = async (projectId: string) => {
    if (!user) return;
    await archiveProject(projectId, user.id);
    await refreshProjects();
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return;
    await deleteProject(projectId, user.id);
    await refreshProjects();
  };

  const visibleProjects = projects.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch =
      !searchFilter.trim() ||
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchFilter.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const createSuggestedRepoRoot = extractRepositoryRootUrl(repositoryUrl);
  const editSuggestedRepoRoot = extractRepositoryRootUrl(editRepositoryUrl);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {activeWorkspace
              ? `Managing projects in ${activeWorkspace.name} — each project includes 4 isolated environments`
              : 'Select a workspace to manage projects'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {activeProject && (
            <button
              type="button"
              onClick={() => openEditProject(activeProject)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm font-medium transition"
            >
              <Edit3 className="w-4 h-4" /> Edit "{activeProject.name}"
            </button>
          )}
          <button
            onClick={() => {
              setShowCreate(true);
              setEditingProject(null);
              setError('');
            }}
            disabled={!activeWorkspace}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      {!workspacesLoading && workspaces.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="Create a workspace first"
          description="Projects belong to a workspace. Create one before adding a project."
          action={
            <Link
              to="/workspaces"
              className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Create Workspace
            </Link>
          }
        />
      ) : (
        <>
          {workspacesError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {workspacesError}
            </p>
          )}

          {/* Edit Project Modal / Panel */}
          {editingProject && (
            <form
              onSubmit={handleSaveEditProject}
              className="space-y-4 rounded-2xl border-2 border-indigo-500 bg-white dark:bg-slate-900 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white text-lg">
                      Edit Project: {editingProject.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Update project name, slug, GitHub repository URL, description, status, or workspace
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Project Name *
                  <input
                    required
                    value={editName}
                    onChange={event => {
                      setEditName(event.target.value);
                      setEditSlug(
                        event.target.value
                          .trim()
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, '')
                      );
                    }}
                    placeholder="e.g., Shivam Landing Frontend"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Project Slug (URL identifier)
                  <input
                    value={editSlug}
                    onChange={event => setEditSlug(event.target.value)}
                    placeholder="e.g., shivam-landing-frontend"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    GitHub / GitLab Repository URL
                    <input
                      type="url"
                      value={editRepositoryUrl}
                      onChange={event => setEditRepositoryUrl(event.target.value)}
                      placeholder="https://github.com/owner/repository"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </label>
                  {editSuggestedRepoRoot && (
                    <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-300">
                      <span>
                        Detected file/branch path in URL. Repository root is{' '}
                        <code className="font-mono font-semibold">{editSuggestedRepoRoot}</code>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditRepositoryUrl(editSuggestedRepoRoot)}
                        className="shrink-0 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium"
                      >
                        Use Repo Root
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Status
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as 'active' | 'paused' | 'archived')}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>

                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Workspace
                    <select
                      value={editWorkspaceId}
                      onChange={e => setEditWorkspaceId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {workspaces.map(ws => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
                <textarea
                  value={editDescription}
                  onChange={event => setEditDescription(event.target.value)}
                  rows={2}
                  placeholder="Describe the service architecture, tech stack, or deployment target..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              {editError && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {editError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {editSaving ? 'Saving Changes...' : 'Save Project Changes'}
                </button>
              </div>
            </form>
          )}

          {showCreate && (
            <form
              onSubmit={handleCreate}
              className="space-y-4 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white text-lg">Create New Project</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Automatically provisions Development, Testing, Staging, and Production environments
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Project Name *
                  <input
                    required
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="e.g., Payment Gateway Service"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Repository URL (optional)
                    <input
                      type="url"
                      value={repositoryUrl}
                      onChange={event => setRepositoryUrl(event.target.value)}
                      placeholder="https://github.com/org/repo"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </label>
                  {createSuggestedRepoRoot && (
                    <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-300">
                      <span>
                        Trim deep path to repo root <code className="font-mono">{createSuggestedRepoRoot}</code>?
                      </span>
                      <button
                        type="button"
                        onClick={() => setRepositoryUrl(createSuggestedRepoRoot)}
                        className="shrink-0 px-2 py-0.5 rounded bg-amber-600 text-white font-medium"
                      >
                        Trim URL
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Description (optional)
                <textarea
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  rows={2}
                  placeholder="Describe the service architecture, team owner, or deployment target..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              {error && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  disabled={saving || !activeWorkspace}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? 'Provisioning Project...' : 'Create Project'}
                </button>
              </div>
            </form>
          )}

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Filter projects by name..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {(['all', 'active', 'paused', 'archived'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {projectsLoading || workspacesLoading ? (
            <p className="text-sm text-slate-500">Loading projects...</p>
          ) : visibleProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No matching projects"
              description="Create a new project to start managing environments, encrypted secrets, branches, and tasks."
              action={
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Create Project
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleProjects.map(project => {
                const isSelected = activeProject?.id === project.id;
                return (
                  <article
                    key={project.id}
                    onClick={() => setActiveProject(project)}
                    className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
                            <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <h2 className="font-semibold text-slate-900 dark:text-white leading-tight">
                              {project.name}
                            </h2>
                            <span className="text-[11px] font-mono text-slate-400">/{project.slug}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-semibold">
                              Active
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                              project.status === 'active'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : project.status === 'paused'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {project.status}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {project.description || 'No description provided.'}
                      </p>

                      {project.repository_url ? (
                        <div className="mt-3 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                          <a
                            className="inline-flex items-center gap-1 max-w-full truncate text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                            href={project.repository_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{project.repository_url}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => openEditProject(project)}
                            className="shrink-0 text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline"
                            title="Edit repository URL"
                          >
                            Change URL
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            openEditProject(project);
                          }}
                          className="mt-3 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          <GitBranch className="w-3 h-3" /> + Link GitHub Repository URL
                        </button>
                      )}
                    </div>

                    <div
                      className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveProject(project);
                            navigate('/environments');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-medium hover:bg-indigo-100"
                        >
                          Secrets
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveProject(project);
                            navigate('/tasks');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200"
                        >
                          Tasks
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveProject(project);
                            navigate('/branches');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200"
                        >
                          Branches
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditProject(project)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs font-medium"
                          title="Edit project name, GitHub repository URL, description, and status"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(project.id, project.status)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 text-xs"
                          title={project.status === 'active' ? 'Pause project' : 'Activate project'}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        {project.status !== 'archived' && (
                          <button
                            type="button"
                            onClick={() => handleArchiveProject(project.id)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950 text-slate-400 hover:text-amber-600"
                            title="Archive project"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-600"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Environments & Zero-Knowledge Secrets Page ─────────────────────
function EnvironmentsPage() {
  const { user, vault, openVaultModal } = useAuth();
  const { projects, activeProject, setActiveProject } = useWorkspace();

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<Environment | null>(null);
  const [secrets, setSecrets] = useState<EncryptedSecret[]>([]);
  const [secretCounts, setSecretCounts] = useState<Record<string, number>>({});
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add secret form
  const [varName, setVarName] = useState('');
  const [varValue, setVarValue] = useState('');
  const [savingSecret, setSavingSecret] = useState(false);
  const [secretMessage, setSecretMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Import .env
  const [showImport, setShowImport] = useState(false);
  const [rawEnvText, setRawEnvText] = useState('');
  const [parsedEntries, setParsedEntries] = useState<ParsedEnvEntry[]>([]);
  const [importing, setImporting] = useState(false);

  const loadEnvironmentsAndCounts = useCallback(async () => {
    if (!activeProject) {
      setEnvironments([]);
      setSelectedEnv(null);
      setSecrets([]);
      return;
    }
    const [envs, counts] = await Promise.all([
      getEnvironments(activeProject.id),
      getProjectSecretCounts(activeProject.id),
    ]);
    setEnvironments(envs);
    setSecretCounts(counts);
    setSelectedEnv(current => envs.find(e => e.id === current?.id) || envs[0] || null);
  }, [activeProject]);

  const loadSecretsForEnv = useCallback(async () => {
    if (!selectedEnv) {
      setSecrets([]);
      return;
    }
    const list = await getSecrets(selectedEnv.id);
    setSecrets(list);
    setRevealedValues({});
  }, [selectedEnv]);

  useEffect(() => {
    loadEnvironmentsAndCounts();
  }, [loadEnvironmentsAndCounts]);

  useEffect(() => {
    loadSecretsForEnv();
  }, [loadSecretsForEnv]);

  const handleAddSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !selectedEnv || !user) return;
    if (vault.isLocked || !vault.vaultKey) {
      openVaultModal();
      return;
    }

    const cleanName = varName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!cleanName || !varValue) return;

    setSavingSecret(true);
    setSecretMessage(null);
    try {
      const encrypted = await CryptoService.encryptSecretValue(varValue, vault.vaultKey);
      await createSecret(
        selectedEnv.id,
        activeProject.id,
        cleanName,
        encrypted.ciphertext,
        encrypted.nonce,
        encrypted.key_version,
        user.id
      );
      setVarName('');
      setVarValue('');
      await Promise.all([loadSecretsForEnv(), loadEnvironmentsAndCounts()]);
      setSecretMessage({ type: 'success', text: `Encrypted and saved ${cleanName} using AES-256-GCM.` });
    } catch (err) {
      setSecretMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to encrypt secret',
      });
    } finally {
      setSavingSecret(false);
    }
  };

  const handleToggleReveal = async (secret: EncryptedSecret) => {
    if (revealedValues[secret.id] !== undefined) {
      setRevealedValues(prev => {
        const copy = { ...prev };
        delete copy[secret.id];
        return copy;
      });
      return;
    }

    if (vault.isLocked || !vault.vaultKey) {
      openVaultModal();
      return;
    }

    try {
      const plaintext = await CryptoService.decryptSecretValue(
        {
          ciphertext: secret.encrypted_value,
          nonce: secret.nonce,
          version: secret.crypto_version,
          key_version: secret.key_version,
        },
        vault.vaultKey
      );
      setRevealedValues(prev => ({ ...prev, [secret.id]: plaintext }));
    } catch {
      setSecretMessage({
        type: 'error',
        text: 'Could not decrypt secret with current vault key.',
      });
    }
  };

  const handleCopySecret = async (secret: EncryptedSecret) => {
    if (vault.isLocked || !vault.vaultKey) {
      openVaultModal();
      return;
    }
    try {
      const plaintext =
        revealedValues[secret.id] ??
        (await CryptoService.decryptSecretValue(
          {
            ciphertext: secret.encrypted_value,
            nonce: secret.nonce,
            version: secret.crypto_version,
            key_version: secret.key_version,
          },
          vault.vaultKey
        ));
      await navigator.clipboard.writeText(plaintext);
      setCopiedId(secret.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setSecretMessage({ type: 'error', text: 'Unlock your vault to copy decrypted secret values.' });
    }
  };

  const handleDeleteSecret = async (secretId: string) => {
    if (!user) return;
    await deleteSecret(secretId, user.id);
    await Promise.all([loadSecretsForEnv(), loadEnvironmentsAndCounts()]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = (ev.target?.result as string) || '';
      setRawEnvText(content);
      const parsed = parseEnvFile(content);
      setParsedEntries(parsed.entries);
    };
    reader.readAsText(file);
  };

  const handleRawEnvChange = (text: string) => {
    setRawEnvText(text);
    const parsed = parseEnvFile(text);
    setParsedEntries(parsed.entries);
  };

  const handleEncryptAndImport = async () => {
    if (!activeProject || !selectedEnv || !user) return;
    if (vault.isLocked || !vault.vaultKey) {
      openVaultModal();
      return;
    }
    const validEntries = parsedEntries.filter(e => e.isValid);
    if (validEntries.length === 0) return;

    setImporting(true);
    try {
      for (const entry of validEntries) {
        const encrypted = await CryptoService.encryptSecretValue(entry.value, vault.vaultKey);
        await createSecret(
          selectedEnv.id,
          activeProject.id,
          entry.name,
          encrypted.ciphertext,
          encrypted.nonce,
          encrypted.key_version,
          user.id
        );
      }
      setRawEnvText('');
      setParsedEntries([]);
      setShowImport(false);
      await Promise.all([loadSecretsForEnv(), loadEnvironmentsAndCounts()]);
      setSecretMessage({
        type: 'success',
        text: `Imported and encrypted ${validEntries.length} variables into ${selectedEnv.name}.`,
      });
    } catch (err) {
      setSecretMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Import failed',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExportEnv = async () => {
    if (!selectedEnv || !activeProject) return;
    if (vault.isLocked || !vault.vaultKey) {
      openVaultModal();
      return;
    }
    try {
      const decryptedPairs: { name: string; value: string }[] = [];
      for (const sec of secrets) {
        const val = await CryptoService.decryptSecretValue(
          {
            ciphertext: sec.encrypted_value,
            nonce: sec.nonce,
            version: sec.crypto_version,
            key_version: sec.key_version,
          },
          vault.vaultKey
        );
        decryptedPairs.push({ name: sec.variable_name, value: val });
      }
      const content = generateEnvFile(decryptedPairs);
      downloadEnvFile(content, `${activeProject.slug}-${selectedEnv.type}.env`);
    } catch {
      setSecretMessage({ type: 'error', text: 'Failed to decrypt secrets for export.' });
    }
  };

  const envBadgeColor: Record<string, string> = {
    development: 'bg-blue-500',
    testing: 'bg-amber-500',
    staging: 'bg-purple-500',
    production: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Environments & Secrets</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            End-to-end encrypted environment variables (AES-256-GCM) scoped per project
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {projects.length > 0 && (
            <select
              value={activeProject?.id || ''}
              onChange={e => {
                const p = projects.find(proj => proj.id === e.target.value) || null;
                setActiveProject(p);
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-white"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  Project: {p.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowImport(!showImport)}
            disabled={!activeProject}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" /> Import .env
          </button>
          <button
            onClick={handleExportEnv}
            disabled={!activeProject || secrets.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Export .env
          </button>
        </div>
      </div>

      {!activeProject ? (
        <EmptyState
          icon={FolderKanban}
          title="No active project selected"
          description="Create or select a project first to manage its Development, Testing, Staging, and Production secrets."
          action={
            <Link
              to="/projects?new=1"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Create Project
            </Link>
          }
        />
      ) : (
        <>
          {/* Environment Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {environments.map(env => {
              const isSelected = selectedEnv?.id === env.id;
              const count = secretCounts[env.id] || 0;
              return (
                <div
                  key={env.id}
                  onClick={() => setSelectedEnv(env)}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 transition cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3 h-3 rounded-full ${envBadgeColor[env.type] || 'bg-indigo-500'}`} />
                      <h3 className="font-semibold text-slate-900 dark:text-white">{env.name}</h3>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-medium">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{count}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">encrypted variables</p>
                </div>
              );
            })}
          </div>

          {/* .env Import Drawer */}
          {showImport && selectedEnv && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900 p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Import .env into <span className="text-indigo-600 dark:text-indigo-400">{selectedEnv.name}</span>
                </h3>
                <button
                  onClick={() => setShowImport(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Upload .env file or paste variables below
                  </label>
                  <input
                    type="file"
                    accept=".env,.txt"
                    onChange={handleFileSelect}
                    className="mb-3 block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300"
                  />
                  <textarea
                    value={rawEnvText}
                    onChange={e => handleRawEnvChange(e.target.value)}
                    rows={5}
                    placeholder={'DATABASE_URL="postgresql://..."\nREDIS_HOST=127.0.0.1\nAPI_SECRET_KEY=sk_live_12345'}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 font-mono text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Parsed Preview ({parsedEntries.filter(e => e.isValid).length} valid)
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    {parsedEntries.length === 0 ? (
                      <p className="text-xs text-slate-400 p-6 text-center">
                        Paste KEY=VALUE lines or choose a file to preview
                      </p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                          <tr>
                            <th className="text-left px-3 py-2 text-slate-500">Variable</th>
                            <th className="text-left px-3 py-2 text-slate-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedEntries.map((entry, idx) => (
                            <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
                              <td className="px-3 py-1.5 font-mono text-slate-900 dark:text-white">{entry.name}</td>
                              <td className="px-3 py-1.5">
                                {entry.isValid ? (
                                  <span className="text-emerald-600 dark:text-emerald-400">Ready to encrypt</span>
                                ) : (
                                  <span className="text-red-500">{entry.error}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleEncryptAndImport}
                      disabled={importing || parsedEntries.filter(e => e.isValid).length === 0}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium disabled:opacity-50"
                    >
                      {vault.isLocked
                        ? 'Unlock Vault & Import'
                        : importing
                          ? 'Encrypting...'
                          : `Encrypt & Import (${parsedEntries.filter(e => e.isValid).length})`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Secrets Manager Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  {selectedEnv ? `${selectedEnv.name} Secrets (${activeProject.name})` : 'Secrets Manager'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Values are encrypted in-browser with AES-256-GCM before storage
                </p>
              </div>
              <button
                onClick={() => (vault.isLocked ? openVaultModal() : undefined)}
                className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium ${
                  vault.isLocked
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 cursor-pointer hover:bg-amber-200'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {vault.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {vault.isLocked ? 'Vault Locked — Click to Unlock' : 'Vault Unlocked'}
              </button>
            </div>

            {/* Add Secret Form */}
            {selectedEnv && (
              <form
                onSubmit={handleAddSecret}
                className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <input
                      required
                      value={varName}
                      onChange={e => setVarName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                      placeholder="VARIABLE_NAME (e.g. API_KEY)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-6">
                    <input
                      required
                      type="password"
                      value={varValue}
                      onChange={e => setVarValue(e.target.value)}
                      placeholder="Secret plaintext value (encrypted before saving)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={savingSecret}
                      className="w-full h-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {vault.isLocked ? 'Unlock & Add' : savingSecret ? 'Saving...' : 'Add Secret'}
                    </button>
                  </div>
                </div>
                {secretMessage && (
                  <p
                    className={`mt-2.5 text-xs ${
                      secretMessage.type === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {secretMessage.text}
                  </p>
                )}
              </form>
            )}

            <div className="p-5">
              {secrets.length === 0 ? (
                <EmptyState
                  icon={Database}
                  title={`No secrets in ${selectedEnv?.name || 'this environment'}`}
                  description="Add a variable above or import a .env file to encrypt secrets client-side."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                        <th className="text-left py-2.5 px-3 font-medium">Variable Name</th>
                        <th className="text-left py-2.5 px-3 font-medium">Value (AES-256-GCM)</th>
                        <th className="text-left py-2.5 px-3 font-medium hidden sm:table-cell">Updated</th>
                        <th className="text-right py-2.5 px-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {secrets.map(sec => {
                        const isRevealed = revealedValues[sec.id] !== undefined;
                        return (
                          <tr key={sec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-3 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                              {sec.variable_name}
                            </td>
                            <td className="py-3 px-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                              {isRevealed ? (
                                <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 break-all">
                                  {revealedValues[sec.id]}
                                </span>
                              ) : (
                                <span className="text-slate-400 select-none">••••••••••••••••••••••••</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-xs text-slate-400 hidden sm:table-cell">
                              {new Date(sec.updated_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleReveal(sec)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                  title={isRevealed ? 'Hide value' : 'Decrypt & reveal'}
                                >
                                  {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopySecret(sec)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                  title="Copy decrypted value"
                                >
                                  {copiedId === sec.id ? (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSecret(sec.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-600"
                                  title="Delete secret"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Branches Page (Fully Wired) ────────────────────────────────────
function BranchesPage() {
  const { user } = useAuth();
  const { projects, activeProject, setActiveProject } = useWorkspace();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [syncing, setSyncing] = useState(false);

  const loadBranches = useCallback(async () => {
    if (!activeProject) {
      setBranches([]);
      return;
    }
    const list = await getBranches(activeProject.id);
    setBranches(list);
  }, [activeProject]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !user || !branchName.trim()) return;
    await createBranch(
      activeProject.id,
      branchName.trim(),
      `refs/heads/${branchName.trim()}`,
      commitMessage.trim() || `Update ${branchName.trim()}`,
      user.id
    );
    setBranchName('');
    setCommitMessage('');
    setShowAdd(false);
    await loadBranches();
  };

  const handleSyncBranches = async () => {
    if (!activeProject) return;
    setSyncing(true);
    for (const b of branches) {
      await updateBranch(b.id, { is_synced: true, commit_date: new Date().toISOString() });
    }
    await loadBranches();
    setSyncing(false);
  };

  const handleToggleActive = async (branch: Branch) => {
    await updateBranch(branch.id, { is_active: !branch.is_active });
    await loadBranches();
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!user) return;
    await deleteBranch(branchId, user.id);
    await loadBranches();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Branches</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Track repository branches and commit status for {activeProject?.name || 'your project'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {projects.length > 0 && (
            <select
              value={activeProject?.id || ''}
              onChange={e => setActiveProject(projects.find(p => p.id === e.target.value) || null)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-white"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleSyncBranches}
            disabled={!activeProject || syncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Git'}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            disabled={!activeProject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition"
          >
            <Plus className="w-4 h-4" /> Add Branch
          </button>
        </div>
      </div>

      {showAdd && activeProject && (
        <form
          onSubmit={handleAddBranch}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">Track New Branch</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Branch Name *
              </label>
              <input
                required
                value={branchName}
                onChange={e => setBranchName(e.target.value)}
                placeholder="feat/oauth2-pkce-flow"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Latest Commit Message
              </label>
              <input
                value={commitMessage}
                onChange={e => setCommitMessage(e.target.value)}
                placeholder="Add PKCE token exchange handler"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium">
              Add Branch
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        {branches.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={GitBranch}
              title="No branches tracked"
              description="Add a branch manually or sync with your Git repository."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {branches.map(branch => (
              <div
                key={branch.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <GitBranch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-mono font-semibold text-sm text-slate-900 dark:text-white">
                      {branch.name}
                    </span>
                    {branch.commit_sha && (
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        #{branch.commit_sha}
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        branch.is_active
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {branch.is_active ? 'Active' : 'Stale'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {branch.commit_message || 'No commit message'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(branch)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Mark {branch.is_active ? 'Stale' : 'Active'}
                  </button>
                  <button
                    onClick={() => handleDeleteBranch(branch.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-600"
                    title="Delete branch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tasks Page (Interactive Kanban Board & List View) ──────────────
function TasksPage() {
  const { user } = useAuth();
  const { projects, activeProject, setActiveProject, activeWorkspace } = useWorkspace();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');

  const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'backlog', title: 'Backlog', color: 'bg-slate-400' },
    { id: 'todo', title: 'To Do', color: 'bg-blue-500' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-amber-500' },
    { id: 'review', title: 'Review', color: 'bg-purple-500' },
    { id: 'done', title: 'Done', color: 'bg-emerald-500' },
  ];

  const loadTasks = useCallback(async () => {
    if (!activeProject) {
      setTasks([]);
      return;
    }
    const list = await getTasks(activeProject.id, undefined, activeWorkspace?.id);
    setTasks(list);
  }, [activeProject, activeWorkspace?.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !user || !title.trim()) return;
    await createTask(activeProject.id, title.trim(), description.trim() || null, priority, {
      status,
      due_date: dueDate || null,
      actor_id: user.id,
    });
    setTitle('');
    setDescription('');
    setDueDate('');
    setShowCreate(false);
    await loadTasks();
  };

  const handleStatusChange = async (taskId: string, nextStatus: TaskStatus) => {
    if (!user) return;
    await updateTask(taskId, { status: nextStatus }, user.id);
    await loadTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    await deleteTask(taskId, user.id);
    await loadTasks();
  };

  const filteredTasks = tasks.filter(t => priorityFilter === 'all' || t.priority === priorityFilter);

  const priorityBadge: Record<TaskPriority, string> = {
    low: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    medium: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    high: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    critical: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Kanban workflow and sprint tasks for {activeProject?.name || 'your project'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {projects.length > 0 && (
            <select
              value={activeProject?.id || ''}
              onChange={e => setActiveProject(projects.find(p => p.id === e.target.value) || null)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-white"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as 'all' | TaskPriority)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => setView('board')}
              className={`px-3 py-1.5 text-xs font-medium ${
                view === 'board'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs font-medium ${
                view === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            disabled={!activeProject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {showCreate && activeProject && (
        <form
          onSubmit={handleCreateTask}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900 p-6 shadow-md space-y-4"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">Create Task in {activeProject.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Task Title *</label>
              <input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Rotate staging JWT signing keys"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Column</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              >
                {columns.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Acceptance criteria and implementation notes..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium">
              Create Task
            </button>
          </div>
        </form>
      )}

      {view === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{col.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-500 ml-auto">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2.5 flex-1 min-h-[140px]">
                  {colTasks.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 text-center">
                      No tasks
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${priorityBadge[task.priority]}`}
                          >
                            {task.priority}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-slate-400 hover:text-red-500"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        {task.due_date && (
                          <p className="text-[10px] text-slate-400 font-mono">Due: {task.due_date}</p>
                        )}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Move to:</span>
                          <select
                            value={task.status}
                            onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                            className="text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-300"
                          >
                            {columns.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          {filteredTasks.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={CheckSquare} title="No tasks found" description="Create tasks to track project deliverables." />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTasks.map(task => (
                <div key={task.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${priorityBadge[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{task.title}</span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={task.status}
                      onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                      className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-slate-800 dark:text-white"
                    >
                      {columns.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Members Page (Workspace RBAC & Invitations) ────────────────────
function MembersPage() {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [members, setMembers] = useState<(WorkspaceMember & { profile: Profile | null })[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('developer');
  const [message, setMessage] = useState('');

  const loadMembersData = useCallback(async () => {
    if (!activeWorkspace) return;
    const [m, inv] = await Promise.all([
      getWorkspaceMembers(activeWorkspace.id),
      getPendingInvitations(activeWorkspace.id),
    ]);
    setMembers(m);
    setInvitations(inv);
  }, [activeWorkspace]);

  useEffect(() => {
    loadMembersData();
  }, [loadMembersData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !user || !inviteEmail.trim()) return;
    await createInvitation(activeWorkspace.id, inviteEmail.trim(), inviteRole, user.id);
    setInviteEmail('');
    setShowInvite(false);
    setMessage(`Invitation created for ${inviteEmail.trim()}`);
    await loadMembersData();
  };

  const handleRoleChange = async (memberUserId: string, role: UserRole) => {
    if (!activeWorkspace) return;
    await updateMemberRole(activeWorkspace.id, memberUserId, role);
    await loadMembersData();
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!activeWorkspace) return;
    await removeWorkspaceMember(activeWorkspace.id, memberUserId);
    await loadMembersData();
  };

  const handleRevokeInvite = async (invId: string) => {
    if (!user) return;
    await revokeInvitation(invId, user.id);
    await loadMembersData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Members</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Role-based access control for {activeWorkspace?.name || 'your workspace'}
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          disabled={!activeWorkspace}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition"
        >
          <Plus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs">
          {message}
        </div>
      )}

      {showInvite && activeWorkspace && (
        <form
          onSubmit={handleInvite}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">Invite Collaborator to {activeWorkspace.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                required
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              >
                <option value="admin">Admin</option>
                <option value="developer">Developer</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium">
              Send Invitation
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">Active Workspace Members ({members.length})</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {members.map(m => (
            <div key={m.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {(m.profile?.full_name || m.profile?.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {m.profile?.full_name || 'Developer'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{m.profile?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={m.role}
                  disabled={m.user_id === user?.id}
                  onChange={e => handleRoleChange(m.user_id, e.target.value as UserRole)}
                  className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-slate-800 dark:text-white capitalize"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="developer">Developer</option>
                  <option value="viewer">Viewer</option>
                </select>
                {m.user_id !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(m.user_id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-600"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {invitations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">Pending Invitations ({invitations.length})</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {invitations.map(inv => (
              <div key={inv.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{inv.email}</p>
                  <p className="text-xs text-slate-400 capitalize">
                    Role: {inv.role} · Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeInvite(inv.id)}
                  className="px-3 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs hover:bg-red-50"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Integrations Page (Interactive Provider Configuration) ─────────
function IntegrationsPage() {
  const { user } = useAuth();
  const { activeProject, projects, setActiveProject } = useWorkspace();
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [activeModalProvider, setActiveModalProvider] = useState<'github' | 'gitlab' | 'jira' | 'slack' | null>(null);
  const [targetEndpoint, setTargetEndpoint] = useState('');

  const loadConnections = useCallback(async () => {
    if (!activeProject) {
      setConnections([]);
      return;
    }
    const list = await getProjectIntegrations(activeProject.id);
    setConnections(list);
  }, [activeProject]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const providers = [
    {
      id: 'github' as const,
      name: 'GitHub',
      description: 'Sync repositories, branches, and pull requests via Edge Function',
      icon: Code2,
      color: 'bg-slate-900 dark:bg-indigo-600',
      placeholder: 'https://github.com/org/repo',
    },
    {
      id: 'gitlab' as const,
      name: 'GitLab',
      description: 'Connect GitLab repositories and CI/CD pipelines',
      icon: GitBranch,
      color: 'bg-orange-500',
      placeholder: 'https://gitlab.com/org/project',
    },
    {
      id: 'jira' as const,
      name: 'Jira Software',
      description: 'Link issue keys and synchronize sprint task status',
      icon: CheckSquare,
      color: 'bg-blue-600',
      placeholder: 'https://your-org.atlassian.net/browse/IDP',
    },
    {
      id: 'slack' as const,
      name: 'Slack',
      description: 'Send deployment and secret rotation alerts to Slack channels',
      icon: Bell,
      color: 'bg-purple-600',
      placeholder: '#platform-deployments',
    },
  ];

  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !activeModalProvider || !user) return;
    await updateIntegrationStatus(activeProject.id, activeModalProvider, 'connected', {
      metadata: { target: targetEndpoint.trim() || 'Configured' },
      actorId: user.id,
    });
    setActiveModalProvider(null);
    setTargetEndpoint('');
    await loadConnections();
  };

  const handleDisconnect = async (provider: 'github' | 'gitlab' | 'jira' | 'slack') => {
    if (!activeProject || !user) return;
    await updateIntegrationStatus(activeProject.id, provider, 'disconnected', {
      actorId: user.id,
    });
    await loadConnections();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Integrations</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Connect external DevOps tools to {activeProject?.name || 'your active project'}
          </p>
        </div>
        {projects.length > 0 && (
          <select
            value={activeProject?.id || ''}
            onChange={e => setActiveProject(projects.find(p => p.id === e.target.value) || null)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-white"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {activeModalProvider && activeProject && (
        <form
          onSubmit={handleSaveIntegration}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900 p-6 shadow-md space-y-4"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white capitalize">
            Configure {activeModalProvider} for {activeProject.name}
          </h3>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Target Repository / Project Key / Channel
            </label>
            <input
              required
              value={targetEndpoint}
              onChange={e => setTargetEndpoint(e.target.value)}
              placeholder={providers.find(p => p.id === activeModalProvider)?.placeholder}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveModalProvider(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium">
              Connect Integration
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map(int => {
          const conn = connections.find(c => c.provider === int.id);
          const isConnected = conn?.status === 'connected';
          return (
            <div
              key={int.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${int.color} flex items-center justify-center shrink-0`}>
                  <int.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{int.name}</h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        isConnected
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {isConnected ? 'Connected' : 'Setup Required'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{int.description}</p>
                  {isConnected && Boolean(conn?.metadata?.target) && (
                    <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mt-2 truncate">
                      Target: {String(conn?.metadata?.target)}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveModalProvider(int.id);
                        setTargetEndpoint(String(conn?.metadata?.target || ''));
                      }}
                      disabled={!activeProject}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white transition disabled:opacity-50"
                    >
                      {isConnected ? 'Reconfigure' : 'Configure'}
                    </button>
                    {isConnected && (
                      <button
                        onClick={() => handleDisconnect(int.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Activity Page (Live Audit Trail) ───────────────────────────────
function ActivityPage() {
  const { activeWorkspace } = useWorkspace();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    getAuditEvents(activeWorkspace?.id, 100).then(setEvents).catch(() => {});
  }, [activeWorkspace?.id]);

  const filtered = events.filter(
    ev =>
      !filterText.trim() ||
      ev.action.toLowerCase().includes(filterText.toLowerCase()) ||
      ev.resource_type.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Activity</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Complete security and operational audit trail for {activeWorkspace?.name || 'your account'}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Filter by action or resource..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Activity} title="No audit events found" description="User actions and security events will appear here." />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(ev => (
              <div key={ev.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      ev.outcome === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {ev.action}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {ev.resource_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Actor: {ev.actor?.full_name || ev.actor?.email || 'Authenticated User'}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(ev.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings Page ──────────────────────────────────────────────────
function SettingsPage() {
  const {
    profile,
    vault,
    updateProfile,
    updatePassword,
    lockVault,
    openVaultModal,
    changeVaultPassphrase,
  } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [newVaultPassphrase, setNewVaultPassphrase] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  const handleUpdateProfile = async () => {
    const { error } = await updateProfile({ full_name: fullName });
    setMessage(error ? `Error: ${error}` : 'Profile updated successfully');
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      setMessage('Error: Password must be at least 8 characters');
      return;
    }
    const { error } = await updatePassword(newPassword);
    if (error) setMessage(`Error: ${error}`);
    else {
      setMessage('Account password updated successfully');
      setNewPassword('');
    }
  };

  const handleRotateVaultPassphrase = async () => {
    const { error } = await changeVaultPassphrase(newVaultPassphrase);
    if (error) setMessage(`Error: ${error}`);
    else {
      setMessage('Vault passphrase rotated and re-encrypted successfully');
      setNewVaultPassphrase('');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage your developer profile, account password, and zero-knowledge vault keys
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium ${
            message.startsWith('Error')
              ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Developer Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input
              value={profile?.email || ''}
              disabled
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleUpdateProfile}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium"
          >
            Save Profile Changes
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Account Password</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Updates your login password (separate from your zero-knowledge vault passphrase).
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleUpdatePassword}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium"
          >
            Update Account Password
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Zero-Knowledge Vault & Key Rotation</h2>
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70">
          <div className="flex items-center gap-3">
            {vault.isLocked ? (
              <Lock className="w-5 h-5 text-amber-500" />
            ) : (
              <Unlock className="w-5 h-5 text-emerald-500" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Vault Status</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {vault.isLocked ? 'Locked — secrets are protected' : 'Unlocked — secrets accessible in memory'}
              </p>
            </div>
          </div>
          <button
            onClick={() => (vault.isLocked ? openVaultModal() : lockVault())}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium ${
              vault.isLocked
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
            }`}
          >
            {vault.isLocked ? 'Unlock Vault' : 'Lock Vault'}
          </button>
        </div>

        {!vault.isLocked && (
          <div className="pt-2 space-y-3">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Rotate Vault Passphrase (min 12 chars)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={newVaultPassphrase}
                onChange={e => setNewVaultPassphrase(e.target.value)}
                placeholder="Enter new 12+ character vault passphrase"
                className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
              <button
                onClick={handleRotateVaultPassphrase}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium"
              >
                Rotate Key
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
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
    const { error: resetErr } = await resetPassword(email);
    if (resetErr) setError(resetErr);
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset Account Password</h1>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-slate-700 dark:text-slate-300 text-sm">
                Password reset instructions have been prepared for {email}.
              </p>
              <Link to="/login" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <p className="mt-4 text-center text-sm">
                <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Global Vault Unlock & Recovery Modal ───────────────────────────
function VaultUnlockModal() {
  const { isVaultModalOpen, closeVaultModal, unlockVault, recoverVaultWithKey, vault } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'passphrase' | 'recovery'>('passphrase');
  const [passphrase, setPassphrase] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isVaultModalOpen) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vault.isInitialized) {
      closeVaultModal();
      navigate('/onboarding');
      return;
    }

    setLoading(true);
    setError('');
    if (mode === 'passphrase') {
      const { error: unlockErr } = await unlockVault(passphrase);
      if (unlockErr) setError(unlockErr);
      else {
        setPassphrase('');
        closeVaultModal();
      }
    } else {
      const { error: recErr } = await recoverVaultWithKey(recoveryKey, newPassphrase);
      if (recErr) setError(recErr);
      else {
        setRecoveryKey('');
        setNewPassphrase('');
        closeVaultModal();
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {mode === 'passphrase' ? 'Unlock Zero-Knowledge Vault' : 'Recover Vault with Recovery Key'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'passphrase'
              ? 'Enter your vault passphrase to decrypt keys in browser memory'
              : 'Enter your recovery key and choose a new 12+ character passphrase'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          {mode === 'passphrase' ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Vault Passphrase
              </label>
              <input
                type="password"
                required
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter your vault passphrase (demo: devportal-demo-vault-key)"
                autoFocus
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Recovery Key
                </label>
                <input
                  required
                  value={recoveryKey}
                  onChange={e => setRecoveryKey(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white"
                  placeholder="XXXXX-XXXXX-XXXXX-..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  New Vault Passphrase (min 12 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={12}
                  value={newPassphrase}
                  onChange={e => setNewPassphrase(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? 'Decrypting Vault...' : mode === 'passphrase' ? 'Unlock Vault' : 'Recover & Unlock'}
          </button>

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'passphrase' ? 'recovery' : 'passphrase');
                setError('');
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {mode === 'passphrase' ? 'Use Recovery Key instead' : 'Back to Passphrase'}
            </button>
            <button
              type="button"
              onClick={closeVaultModal}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── App Router ─────────────────────────────────────────────────────
function AppRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Routes>
        {!user && (
          <Route
            path="/"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <LandingPage />
              </Suspense>
            }
          />
        )}

        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspaces"
          element={
            <ProtectedRoute>
              <AppLayout>
                <WorkspacesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProjectsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/environments"
          element={
            <ProtectedRoute>
              <AppLayout>
                <EnvironmentsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/branches"
          element={
            <ProtectedRoute>
              <AppLayout>
                <BranchesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <AppLayout>
                <TasksPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MembersPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/integrations"
          element={
            <ProtectedRoute>
              <AppLayout>
                <IntegrationsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ActivityPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {user && <Route path="/" element={<Navigate to="/dashboard" replace />} />}
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
      </Routes>
      <VaultUnlockModal />
    </>
  );
}

// ─── Root App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <HashRouter>
          <AppRouter />
        </HashRouter>
      </WorkspaceProvider>
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <ConnectionStatusLazy />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <DatabaseSetupGuideLazy />
      </Suspense>
    </AuthProvider>
  );
}
