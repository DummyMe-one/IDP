import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/stores/AuthContext';
import { getWorkspaces } from '@/services/api';
import type { Workspace, UserRole } from '@/types';

interface WorkspaceContextType {
  workspaces: (Workspace & { member_role: UserRole })[];
  activeWorkspace: (Workspace & { member_role: UserRole }) | null;
  setActiveWorkspace: (ws: Workspace & { member_role: UserRole } | null) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<(Workspace & { member_role: UserRole })[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<(Workspace & { member_role: UserRole }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getWorkspaces(user.id);
      setWorkspaces(data);
      if (!activeWorkspace && data.length > 0) {
        setActiveWorkspace(data[0]);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user]);

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, setActiveWorkspace, isLoading, refresh }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
