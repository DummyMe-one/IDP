import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/stores/AuthContext';
import { getWorkspaces } from '@/services/api';
import type { Workspace, UserRole } from '@/types';

interface WorkspaceContextType {
  workspaces: (Workspace & { member_role: UserRole })[];
  activeWorkspace: (Workspace & { member_role: UserRole }) | null;
  setActiveWorkspace: (ws: Workspace & { member_role: UserRole } | null) => void;
  isLoading: boolean;
  loadError: string | null;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<(Workspace & { member_role: UserRole })[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<(Workspace & { member_role: UserRole }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const userId = user?.id;

  const refresh = useCallback(async () => {
    if (!userId) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getWorkspaces(userId);
      setWorkspaces(data);
      setActiveWorkspace(current =>
        data.find(workspace => workspace.id === current?.id) ?? data[0] ?? null
      );
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setLoadError(err instanceof Error ? err.message : 'Could not load workspaces.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, setActiveWorkspace, isLoading, loadError, refresh }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
