import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { CheckCircle, Database, Loader2, X } from 'lucide-react';

export default function ConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'local'>('checking');
  const [message, setMessage] = useState('Checking storage...');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function checkConnection() {
      if (!isSupabaseConfigured) {
        setStatus('local');
        setMessage('User-scoped Local Vault DB active');
        return;
      }
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          setStatus('local');
          setMessage('Hybrid Local Vault DB active');
        } else {
          setStatus('connected');
          setMessage('Supabase Cloud + Local Sync active');
        }
      } catch {
        setStatus('local');
        setMessage('User-scoped Local Vault DB active');
      }
    }
    checkConnection();
  }, []);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg px-3.5 py-2.5 flex items-center gap-2.5 text-xs">
      {status === 'checking' && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />}
      {status === 'connected' && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
      {status === 'local' && <Database className="w-4 h-4 text-indigo-500 shrink-0" />}
      <div>
        <span className="font-semibold text-slate-900 dark:text-white mr-1.5">Storage:</span>
        <span className="text-slate-600 dark:text-slate-400">{message}</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="ml-1 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
        aria-label="Dismiss storage status"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
