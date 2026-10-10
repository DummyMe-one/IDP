import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { AlertTriangle, CheckCircle, Database, ExternalLink, Copy, Check } from 'lucide-react';

export default function DatabaseSetupGuide() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'needs_setup'>('checking');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkDatabase();
  }, []);

  async function checkDatabase() {
    try {
      // Try to query the profiles table
      const { error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          setStatus('needs_setup');
        } else {
          // Other error - might be auth related, which is fine
          setStatus('ready');
        }
      } else {
        setStatus('ready');
      }
    } catch {
      setStatus('needs_setup');
    }
  }

  const handleCopy = () => {
    const sqlInstructions = `Go to your Supabase Dashboard → SQL Editor → New Query, then paste the contents of supabase/migrations/001_initial_schema.sql and click Run.`;
    navigator.clipboard.writeText(sqlInstructions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'ready' || status === 'checking') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
            <Database className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Database Setup Required</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your Supabase connection works, but the database tables need to be created.</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Quick Setup Steps:</h3>
          <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <span>Open your <a href="https://supabase.com/dashboard/project/nlmynmcbjmnyqbbbprkx/sql" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">Supabase SQL Editor <ExternalLink className="w-3 h-3" /></a></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <span>Click "New Query"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <span>Copy the contents of <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">supabase/migrations/001_initial_schema.sql</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">4</span>
              <span>Paste it and click <strong>Run</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">5</span>
              <span>Refresh this page when done</span>
            </li>
          </ol>
        </div>

        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="text-sm text-green-800 dark:text-green-200">
              <strong>Good news:</strong> Your Supabase connection is working! The URL and API key are correctly configured.
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Also configure:</strong> Go to Authentication → URL Configuration and set redirect URLs to include <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-xs">http://localhost:3000/**</code>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <a 
            href="https://supabase.com/dashboard/project/nlmynmcbjmnyqbbbprkx/sql" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            <ExternalLink className="w-4 h-4" />
            Open SQL Editor
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Instructions'}
          </button>
        </div>
      </div>
    </div>
  );
}
