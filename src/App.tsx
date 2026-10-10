import React from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/stores/AuthContext';
import { WorkspaceProvider } from '@/stores/WorkspaceContext';
import {
  LayoutDashboard, FolderKanban, Shield, GitBranch, CheckSquare, Users,
  Settings, LogOut, Lock, Unlock, ChevronLeft, ChevronRight, Bell,
  Search, Plus, Globe, Key, FileText, Activity, Server, Package,
  Lock as LockIcon, Unlock as UnlockIcon, AlertTriangle, CheckCircle,
  Clock, ArrowRight, Menu, X, Moon, Sun, Zap, Database, Code2
} from 'lucide-react';
import { useState, useEffect, type ReactNode } from 'react';

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
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading DevPortal...</p>
      </div>
    </div>
  );
}

// ─── Auth Pages ─────────────────────────────────────────────────────
function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate('/'); }, [user, navigate]);

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
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 p-8 border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Sign in</h2>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" placeholder="you@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50 shadow-lg shadow-indigo-500/25">
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 p-8 border border-slate-200 dark:border-slate-800">
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
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50 shadow-lg shadow-indigo-500/25">
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

  useEffect(() => { if (isOnboarded) navigate('/'); }, [isOnboarded, navigate]);

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
                You will need it every time you unlock your vault.
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
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Passphrase</label>
                <input type="password" value={confirmPassphrase} onChange={e => setConfirmPassphrase(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" />
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
                This will generate your encryption keys and set up your secure vault. This may take a moment.
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
              <button onClick={() => navigate('/')} disabled={!savedRecovery}
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
  const { vault, lockVault, signOut, profile } = useAuth();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
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

  return (
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
        <button onClick={() => vault.isLocked ? null : lockVault()}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full transition text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800`}>
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
  );
}

// ─── Main Layout ────────────────────────────────────────────────────
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
                <input type="text" placeholder="Search projects, tasks..." className="pl-10 pr-4 py-2 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────
function DashboardPage() {
  const { profile } = useAuth();
  const [stats] = useState({ projects: 0, tasks: 0, workspaces: 0, members: 0 });

  const statCards = [
    { label: 'Projects', value: stats.projects, icon: FolderKanban, color: 'from-blue-500 to-blue-600' },
    { label: 'Open Tasks', value: stats.tasks, icon: CheckSquare, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Workspaces', value: stats.workspaces, icon: Globe, color: 'from-purple-500 to-purple-600' },
    { label: 'Team Members', value: stats.members, icon: Users, color: 'from-amber-500 to-amber-600' },
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
        <Link to="/projects" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition shadow-lg shadow-indigo-500/25">
          <Plus className="w-4 h-4" /> New Project
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent Projects</h2>
            <Link to="/projects" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
          </div>
          <div className="p-5">
            <EmptyState icon={Package} title="No projects yet" description="Create your first project to get started" action={<Link to="/projects" className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">Create project</Link>} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="p-5">
            <EmptyState icon={Activity} title="No activity yet" description="Activity will appear here as you work" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">Upcoming Deadlines</h2>
          </div>
          <div className="p-5">
            <EmptyState icon={Clock} title="No upcoming deadlines" description="Tasks with due dates will appear here" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">Security Status</h2>
          </div>
          <div className="p-5 space-y-3">
            <SecurityStatusItem label="Vault" status="active" description="Encryption keys loaded" />
            <SecurityStatusItem label="RLS Policies" status="active" description="Database access control enabled" />
            <SecurityStatusItem label="Key Rotation" status="warning" description="No rotations performed yet" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityStatusItem({ label, status, description }: { label: string; status: 'active' | 'warning' | 'error'; description: string }) {
  const colors = { active: 'bg-green-500', warning: 'bg-amber-500', error: 'bg-red-500' };
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

// ─── Workspaces Page ────────────────────────────────────────────────
function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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
            <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm">Create</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.length === 0 ? (
          <div className="col-span-full">
            <EmptyState icon={Globe} title="No workspaces" description="Create a workspace to organize your projects and team" />
          </div>
        ) : workspaces.map(ws => (
          <div key={ws.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">Active</span>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mt-3">{ws.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{ws.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Projects Page ──────────────────────────────────────────────────
function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your software projects</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>
      <EmptyState icon={FolderKanban} title="No projects yet" description="Create a project to start managing environments, secrets, and tasks" action={
        <button className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">Create Project</button>
      } />
    </div>
  );
}

// ─── Environments Page ──────────────────────────────────────────────
function EnvironmentsPage() {
  const { vault } = useAuth();
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    
    // Read and parse the file locally
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      // Simple parse preview
      const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
      const entries = lines.map(line => {
        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) return null;
        const name = line.slice(0, eqIdx).trim();
        return { name, value: '••••••••' };
      }).filter(Boolean);
      setImportPreview(entries);
    };
    reader.readAsText(file);
  };

  const environments = [
    { name: 'Development', type: 'development', color: 'bg-blue-500', secrets: 0, icon: Code2 },
    { name: 'Testing', type: 'testing', color: 'bg-amber-500', secrets: 0, icon: CheckCircle },
    { name: 'Staging', type: 'staging', color: 'bg-purple-500', secrets: 0, icon: Server },
    { name: 'Production', type: 'production', color: 'bg-red-500', secrets: 0, icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Environments</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage deployment environments and encrypted secrets</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowImport(!showImport)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <FileText className="w-4 h-4" /> Import .env
          </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Import .env File</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Files are parsed and encrypted locally. Plaintext is never uploaded or persisted. Values are encrypted before saving to the database.</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select .env file</label>
              <input type="file" accept=".env,.txt" onChange={handleFileSelect}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300" />
            </div>
            {importPreview.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Preview ({importPreview.length} variables found)</p>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-medium">Variable</th>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((entry, i) => (
                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-3 py-2 font-mono text-slate-900 dark:text-white">{entry.name}</td>
                          <td className="px-3 py-2 font-mono text-slate-500">{entry.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex gap-2">
                  <button disabled={vault.isLocked}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 transition">
                    {vault.isLocked ? 'Unlock vault first' : 'Encrypt & Import'}
                  </button>
                  <button onClick={() => { setImportFile(null); setImportPreview([]); }}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {environments.map(env => (
          <div key={env.type} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${env.color}`} />
              <h3 className="font-semibold text-slate-900 dark:text-white">{env.name}</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{env.secrets}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">encrypted secrets</p>
            <button className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Manage secrets →</button>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">Secrets Manager</h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${vault.isLocked ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'}`}>
              {vault.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              {vault.isLocked ? 'Vault locked' : 'Vault unlocked'}
            </span>
          </div>
        </div>
        <div className="p-5">
          <EmptyState icon={Database} title="Select a project and environment" description="Choose a project and environment to manage encrypted secrets. Import from .env files or add variables manually." />
        </div>
      </div>
    </div>
  );
}

// ─── Branches Page ──────────────────────────────────────────────────
function BranchesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Branches</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track repository branches and commits</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
          <Plus className="w-4 h-4" /> Add Branch
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="p-5">
          <EmptyState icon={GitBranch} title="No branches tracked" description="Add branches manually or connect GitHub integration for automatic sync" />
        </div>
      </div>
    </div>
  );
}

// ─── Tasks Page ─────────────────────────────────────────────────────
function TasksPage() {
  const [view, setView] = useState<'list' | 'board'>('board');

  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'bg-slate-400' },
    { id: 'todo', title: 'To Do', color: 'bg-blue-500' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-amber-500' },
    { id: 'review', title: 'Review', color: 'bg-purple-500' },
    { id: 'done', title: 'Done', color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track and manage project tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 text-sm ${view === 'list' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>List</button>
            <button onClick={() => setView('board')} className={`px-3 py-1.5 text-sm ${view === 'board' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>Board</button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {view === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {columns.map(col => (
            <div key={col.id} className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{col.title}</span>
                <span className="text-xs text-slate-400 ml-auto">0</span>
              </div>
              <div className="space-y-2 min-h-[100px]">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-400 text-center">
                  No tasks
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="p-5">
            <EmptyState icon={CheckSquare} title="No tasks" description="Create tasks to track your project progress" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Members Page ───────────────────────────────────────────────────
function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Members</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage team members and invitations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
          <Plus className="w-4 h-4" /> Invite Member
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="p-5">
          <EmptyState icon={Users} title="No team members" description="Invite team members to collaborate on workspaces and projects" />
        </div>
      </div>
    </div>
  );
}

// ─── Integrations Page ──────────────────────────────────────────────
function IntegrationsPage() {
  const integrations = [
    { name: 'GitHub', description: 'Sync repositories, branches, and pull requests', icon: Code2, status: 'setup_required' as const, color: 'bg-slate-900 dark:bg-white' },
    { name: 'GitLab', description: 'Connect GitLab repositories and CI/CD', icon: GitBranch, status: 'setup_required' as const, color: 'bg-orange-500' },
    { name: 'Jira', description: 'Sync issues and track progress', icon: CheckSquare, status: 'setup_required' as const, color: 'bg-blue-600' },
    { name: 'Slack', description: 'Get notifications and updates in Slack', icon: Bell, status: 'setup_required' as const, color: 'bg-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Integrations</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Connect external services to your projects</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map(int => (
          <div key={int.name} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${int.color} flex items-center justify-center`}>
                <int.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{int.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">Setup Required</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{int.description}</p>
                <button className="mt-3 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Configure
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-200 dark:border-amber-800 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-200">Integration Security Notice</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Integration credentials are managed server-side through Supabase Edge Functions. 
              No OAuth secrets or API tokens are stored in the frontend. Manual configuration is required for each integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Page ──────────────────────────────────────────────────
function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Audit log and recent events</p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="p-5">
          <EmptyState icon={Activity} title="No activity recorded" description="Security events and user actions will appear here" />
        </div>
      </div>
    </div>
  );
}

// ─── Settings Page ──────────────────────────────────────────────────
function SettingsPage() {
  const { profile, vault, updateProfile, updatePassword, lockVault } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleUpdateProfile = async () => {
    const { error } = await updateProfile({ full_name: fullName });
    setMessage(error ? `Error: ${error}` : 'Profile updated');
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) { setMessage('Password must be at least 8 characters'); return; }
    const { error } = await updatePassword(newPassword);
    setMessage(error ? `Error: ${error}` : 'Password updated. Note: This does not change your vault passphrase.');
    setNewPassword('');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account and security settings</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.startsWith('Error') ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input value={profile?.email || ''} disabled className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={handleUpdateProfile} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">Save Changes</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Account Password</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">This is your Supabase account password, separate from your vault passphrase.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={handleUpdatePassword} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">Update Password</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Vault & Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              {vault.isLocked ? <LockIcon className="w-5 h-5 text-amber-500" /> : <UnlockIcon className="w-5 h-5 text-green-500" />}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Vault Status</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{vault.isLocked ? 'Locked - secrets are protected' : 'Unlocked - secrets accessible'}</p>
              </div>
            </div>
            <button onClick={vault.isLocked ? () => {} : lockVault}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${vault.isLocked ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'}`}>
              {vault.isLocked ? 'Unlock' : 'Lock'}
            </button>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Encryption</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">AES-256-GCM with RSA-OAEP key wrapping. PBKDF2 key derivation (600K iterations).</p>
          </div>
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Key Recovery</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">If you lose both your vault passphrase and recovery key, encrypted data is permanently unrecoverable. No administrator backdoor exists.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 p-8 border border-slate-200 dark:border-slate-800">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-700 dark:text-slate-300">Check your email for a password reset link.</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Note: This resets your account password, not your vault passphrase.</p>
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
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
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

// ─── Vault Unlock Modal ─────────────────────────────────────────────
function VaultUnlockModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { unlockVault } = useAuth();
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!passphrase) return;
    setLoading(true);
    setError('');
    const { error } = await unlockVault(passphrase);
    if (error) setError(error);
    else { setPassphrase(''); onClose(); }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unlock Vault</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your vault passphrase to access encrypted data</p>
        </div>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vault Passphrase</label>
            <input type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
              placeholder="Enter your vault passphrase" autoFocus />
          </div>
          <button onClick={handleUnlock} disabled={loading || !passphrase}
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50">
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
          <button onClick={onClose} className="w-full py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium transition hover:bg-slate-50 dark:hover:bg-slate-800">
            Cancel
          </button>
        </div>
        <p className="mt-4 text-xs text-center text-slate-400 dark:text-slate-500">
          This is your vault passphrase, not your account password.
        </p>
      </div>
    </div>
  );
}

// ─── App Router ─────────────────────────────────────────────────────
function AppRouter() {
  const [showVaultModal, setShowVaultModal] = useState(false);
  const { vault, isOnboarded, user } = useAuth();
  const navigate = useNavigate();

  // Show vault unlock modal when vault is initialized but locked
  useEffect(() => {
    if (user && vault.isInitialized && vault.isLocked && !isOnboarded) {
      // First time - redirect to onboarding
    }
  }, [user, vault, isOnboarded]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspaces" element={<ProtectedRoute><AppLayout><WorkspacesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><AppLayout><ProjectsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/environments" element={<ProtectedRoute><AppLayout><EnvironmentsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/branches" element={<ProtectedRoute><AppLayout><BranchesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><AppLayout><TasksPage /></AppLayout></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><AppLayout><MembersPage /></AppLayout></ProtectedRoute>} />
        <Route path="/integrations" element={<ProtectedRoute><AppLayout><IntegrationsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><AppLayout><ActivityPage /></AppLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <VaultUnlockModal isOpen={showVaultModal} onClose={() => setShowVaultModal(false)} />
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
    </AuthProvider>
  );
}
