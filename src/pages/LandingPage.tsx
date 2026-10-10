import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Key, Database, GitBranch, CheckSquare, Users, Globe,
  Zap, Server, ArrowRight, Github, Star, Sparkles, Code2, Terminal,
  Eye, EyeOff, RefreshCw, Fingerprint, Layers, FileText, ChevronRight,
  Menu, X, ShieldCheck, LockKeyhole, KeyRound, ServerCog, Sun, Moon
} from 'lucide-react';

// ─── Navbar ─────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white">DevPortal</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Features</a>
          <a href="#security" className="text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Security</a>
          <a href="#how-it-works" className="text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">How it works</a>
          <a href="#stack" className="text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Stack</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition px-4 py-2">
            Sign in
          </Link>
          <Link to="/register" className="text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-4 py-2 rounded-lg transition shadow-lg shadow-indigo-500/25">
            Get started
          </Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-slate-700 dark:text-slate-300">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-6 py-4 space-y-3">
          <a href="#features" className="block text-sm text-slate-600 dark:text-slate-300 py-2">Features</a>
          <a href="#security" className="block text-sm text-slate-600 dark:text-slate-300 py-2">Security</a>
          <a href="#how-it-works" className="block text-sm text-slate-600 dark:text-slate-300 py-2">How it works</a>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <Link to="/login" className="text-sm font-medium text-slate-700 dark:text-slate-300 py-2">Sign in</Link>
            <Link to="/register" className="text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-lg text-center">Get started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero Section ───────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-950 dark:via-indigo-950/20 dark:to-purple-950/20" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-400/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_30%,transparent_100%)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]" />

      <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 mb-8"
        >
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Zero-knowledge encrypted developer portal</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6"
        >
          Your code deserves a
          <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            secure home
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          The internal developer portal that manages projects, environments, and encrypted secrets — 
          with end-to-end encryption that even we can't break.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/register" className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium transition shadow-xl shadow-indigo-500/25">
            Start for free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
          <a href="#features" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:border-indigo-300 dark:hover:border-indigo-700 transition shadow-sm">
            See features
            <ChevronRight className="w-4 h-4" />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 relative"
        >
          {/* App preview mockup */}
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full" />
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white dark:bg-slate-800 rounded-md px-3 py-1 text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">
                    devportal.app/#/dashboard
                  </div>
                </div>
              </div>
              {/* App content */}
              <div className="flex h-[400px] md:h-[500px]">
                {/* Sidebar */}
                <div className="hidden md:block w-56 border-r border-slate-200 dark:border-slate-800 p-3 space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 mb-4">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">DevPortal</span>
                  </div>
                  {['Dashboard', 'Workspaces', 'Projects', 'Environments', 'Branches', 'Tasks', 'Members'].map((item, i) => (
                    <div key={item} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs ${i === 0 ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      <div className="w-3.5 h-3.5 rounded bg-current opacity-30" />
                      {item}
                    </div>
                  ))}
                </div>
                {/* Main content */}
                <div className="flex-1 p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                      <div className="h-3 w-56 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="h-8 w-24 bg-indigo-500 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                      { color: 'from-blue-500 to-blue-600', label: 'Projects' },
                      { color: 'from-emerald-500 to-emerald-600', label: 'Tasks' },
                      { color: 'from-purple-500 to-purple-600', label: 'Workspaces' },
                      { color: 'from-amber-500 to-amber-600', label: 'Members' },
                    ].map(card => (
                      <div key={card.label} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                        <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${card.color} mb-2`} />
                        <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
                        <div className="h-2 w-12 bg-slate-100 dark:bg-slate-800 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700" />
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded" />
                            <div className="w-12 h-2 bg-slate-100 dark:bg-slate-700 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500 dark:text-slate-400"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>AES-256-GCM encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <LockKeyhole className="w-4 h-4 text-indigo-500" />
            <span>Zero-knowledge architecture</span>
          </div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-500" />
            <span>RSA-OAEP key wrapping</span>
          </div>
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-pink-500" />
            <span>Open source</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Stats Section ──────────────────────────────────────────────────
function Stats() {
  const stats = [
    { value: '256-bit', label: 'AES encryption' },
    { value: '4096-bit', label: 'RSA key pairs' },
    { value: '600K', label: 'PBKDF2 iterations' },
    { value: '0', label: 'Backdoors' },
  ];

  return (
    <section className="relative py-20 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ───────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: Lock,
      title: 'Encrypted Vault',
      description: 'Your secrets are encrypted in the browser before reaching our servers. We literally cannot read them.',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      icon: Globe,
      title: 'Multi-Workspace',
      description: 'Organize teams into workspaces with granular roles. Switch contexts instantly between projects.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Server,
      title: 'Environment Secrets',
      description: 'Manage dev, staging, and production secrets separately. Import .env files with one click.',
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: GitBranch,
      title: 'Branch Tracking',
      description: 'Track repository branches and commits. Sync with GitHub or manage branches manually.',
      color: 'from-amber-500 to-amber-600',
    },
    {
      icon: CheckSquare,
      title: 'Task Management',
      description: 'Kanban boards and lists for every project. Track progress with priorities and due dates.',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Invite members, assign roles, and share encrypted project keys securely via RSA-OAEP.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Zap,
      title: 'Integrations',
      description: 'Connect GitHub, GitLab, Jira, and Slack. Server-side credentials keep tokens safe.',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: FileText,
      title: 'Audit Trail',
      description: 'Every action is logged. See who did what, when, with complete security event history.',
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      icon: Key,
      title: 'Key Recovery',
      description: 'High-entropy recovery keys protect your vault. Lose your passphrase? You can still recover.',
      color: 'from-violet-500 to-violet-600',
    },
  ];

  return (
    <section id="features" className="relative py-24 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 mb-4">
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">FEATURES</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Everything your team needs
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            A complete developer portal with security baked in from day one. Not bolted on.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Security Section ───────────────────────────────────────────────
function Security() {
  return (
    <section id="security" className="relative py-24 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-800 mb-4">
              <Shield className="w-3 h-3 text-red-600 dark:text-red-400" />
              <span className="text-xs font-medium text-red-700 dark:text-red-300">SECURITY FIRST</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              We can't read your secrets.
              <br />
              <span className="text-slate-400 dark:text-slate-600">And that's the point.</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              DevPortal uses zero-knowledge encryption. Your vault passphrase never leaves your browser. 
              Even if our database is compromised, attackers get ciphertext — not your secrets.
            </p>

            <div className="space-y-4">
              {[
                { icon: Lock, title: 'Client-side encryption', desc: 'AES-256-GCM encrypts secrets before they hit the network' },
                { icon: Key, title: 'RSA-OAEP key wrapping', desc: 'Share project keys securely with team members' },
                { icon: Fingerprint, title: 'PBKDF2 key derivation', desc: '600,000 iterations protect your vault passphrase' },
                { icon: ShieldCheck, title: 'Row Level Security', desc: 'Database-level access control on every table' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{item.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Encryption flow diagram */}
            <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-800 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-slate-500 font-mono">encryption-flow.ts</span>
              </div>
              <div className="font-mono text-sm space-y-2">
                <div className="text-slate-500">// Your passphrase → vault key</div>
                <div>
                  <span className="text-purple-400">const</span>{' '}
                  <span className="text-blue-300">kek</span>{' '}
                  <span className="text-slate-400">=</span>{' '}
                  <span className="text-yellow-300">PBKDF2</span>
                  <span className="text-slate-400">(</span>
                  <span className="text-green-300">passphrase</span>
                  <span className="text-slate-400">,</span>{' '}
                  <span className="text-green-300">salt</span>
                  <span className="text-slate-400">)</span>
                </div>
                <div>
                  <span className="text-purple-400">const</span>{' '}
                  <span className="text-blue-300">vaultKey</span>{' '}
                  <span className="text-slate-400">=</span>{' '}
                  <span className="text-yellow-300">AES</span>
                  <span className="text-slate-400">.</span>
                  <span className="text-yellow-300">decrypt</span>
                  <span className="text-slate-400">(</span>
                  <span className="text-green-300">encrypted</span>
                  <span className="text-slate-400">,</span>{' '}
                  <span className="text-blue-300">kek</span>
                  <span className="text-slate-400">)</span>
                </div>
                <div className="h-3" />
                <div className="text-slate-500">// Project key → wrapped for you</div>
                <div>
                  <span className="text-purple-400">const</span>{' '}
                  <span className="text-blue-300">projectKey</span>{' '}
                  <span className="text-slate-400">=</span>{' '}
                  <span className="text-yellow-300">RSA</span>
                  <span className="text-slate-400">.</span>
                  <span className="text-yellow-300">unwrap</span>
                  <span className="text-slate-400">(</span>
                </div>
                <div className="pl-4">
                  <span className="text-green-300">envelope</span>
                  <span className="text-slate-400">,</span>{' '}
                  <span className="text-blue-300">privateKey</span>
                </div>
                <div>
                  <span className="text-slate-400">)</span>
                </div>
                <div className="h-3" />
                <div className="text-slate-500">// Secret → encrypted before DB</div>
                <div>
                  <span className="text-purple-400">const</span>{' '}
                  <span className="text-blue-300">ciphertext</span>{' '}
                  <span className="text-slate-400">=</span>{' '}
                  <span className="text-yellow-300">AES</span>
                  <span className="text-slate-400">.</span>
                  <span className="text-yellow-300">encrypt</span>
                  <span className="text-slate-400">(</span>
                  <span className="text-green-300">secret</span>
                  <span className="text-slate-400">,</span>{' '}
                  <span className="text-blue-300">projectKey</span>
                  <span className="text-slate-400">)</span>
                </div>
                <div className="h-3" />
                <div>
                  <span className="text-yellow-300">supabase</span>
                  <span className="text-slate-400">.</span>
                  <span className="text-yellow-300">save</span>
                  <span className="text-slate-400">(</span>
                  <span className="text-blue-300">ciphertext</span>
                  <span className="text-slate-400">)</span>{' '}
                  <span className="text-slate-500">// ✅ Only ciphertext</span>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              🔒 Encrypted
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Zero-knowledge
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works Section ───────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: Users,
      title: 'Create your workspace',
      description: 'Sign up, verify your email, and create a workspace for your team. Invite members with role-based permissions.',
    },
    {
      num: '02',
      icon: Lock,
      title: 'Set up your vault',
      description: 'Choose a vault passphrase (separate from your password). Generate recovery keys. Your encryption keys are created locally.',
    },
    {
      num: '03',
      icon: Zap,
      title: 'Start building',
      description: 'Create projects, manage environments, import .env files, track branches, and collaborate — all encrypted end-to-end.',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 mb-4">
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">HOW IT WORKS</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Up and running in minutes
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Three simple steps to secure developer infrastructure.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-5xl font-bold text-slate-100 dark:text-slate-800">{step.num}</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-30" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Tech Stack Section ─────────────────────────────────────────────
function TechStack() {
  const stack = [
    { name: 'React', category: 'Frontend' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Vite', category: 'Build' },
    { name: 'Tailwind', category: 'Styling' },
    { name: 'Supabase', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'Web Crypto', category: 'Encryption' },
    { name: 'GitHub Pages', category: 'Hosting' },
  ];

  return (
    <section id="stack" className="relative py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 mb-4">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">TECH STACK</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Built with modern tools
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Industry-standard technologies you already know and trust.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stack.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">{tech.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{tech.category}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            <Github className="w-4 h-4" />
            View source on GitHub
            <ArrowRight className="w-3 h-3" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ─── CTA Section ────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
            <Sparkles className="w-3 h-3 text-white" />
            <span className="text-xs font-medium text-white">Free to get started</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to secure your
            <br />
            development workflow?
          </h2>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Join teams who trust DevPortal to manage their projects, secrets, and collaboration — 
            with encryption that actually works.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-600 font-semibold hover:bg-slate-100 transition shadow-2xl">
              Get started free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link to="/login" className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/20 transition">
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/60">
            No credit card required · Open source · Self-hostable
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">DevPortal</span>
            </div>
            <p className="text-sm max-w-xs leading-relaxed">
              The secure internal developer portal with zero-knowledge encryption. 
              Your secrets stay yours.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition">Features</a></li>
              <li><a href="#security" className="hover:text-white transition">Security</a></li>
              <li><a href="#stack" className="hover:text-white transition">Tech Stack</a></li>
              <li><Link to="/register" className="hover:text-white transition">Get Started</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition">Architecture</a></li>
              <li><a href="#" className="hover:text-white transition">Threat Model</a></li>
              <li><a href="#" className="hover:text-white transition">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">© 2026 DevPortal. Open source under MIT license.</p>
          <div className="flex items-center gap-6 text-xs">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Landing Page ───────────────────────────────────────────────────
export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Security />
      <HowItWorks />
      <TechStack />
      <CTA />
      <Footer />

      {/* Theme toggle - floating */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-center hover:scale-110 transition"
        aria-label="Toggle theme"
      >
        {darkMode ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600" />
        )}
      </button>
    </div>
  );
}
