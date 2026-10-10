import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [message, setMessage] = useState('Checking connection...');

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      // Test connection by checking auth state
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setStatus('error');
        setMessage(`Connection failed: ${error.message}`);
      } else {
        setStatus('connected');
        setMessage('Connected to Supabase successfully');
      }
    } catch (err) {
      setStatus('error');
      setMessage(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-3 max-w-xs">
      <div className="flex items-start gap-2">
        {status === 'checking' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin mt-0.5" />}
        {status === 'connected' && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />}
        {status === 'error' && <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
        <div className="flex-1">
          <div className="text-xs font-medium text-slate-900 dark:text-white">Supabase Status</div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{message}</div>
        </div>
      </div>
    </div>
  );
}
