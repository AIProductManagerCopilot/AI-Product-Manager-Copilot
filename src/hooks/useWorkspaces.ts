import { useState, useEffect, useMemo, useCallback } from 'react';
import { workspaceService, type Workspace } from '../services/workspaceService';

export type SortOption = 'newest' | 'updated' | 'alphabetical' | 'priority';

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export function useWorkspaces(userId: string | undefined) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterProductType, setFilterProductType] = useState<string>('');
  const [filterStage, setFilterStage] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  // Real-time listener
  useEffect(() => {
    if (!userId) {
      setWorkspaces([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = workspaceService.subscribeToUserWorkspaces(
      userId,
      (data) => {
        setWorkspaces(data);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Derived: filtered + sorted
  const filteredWorkspaces = useMemo(() => {
    let result = [...workspaces];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.workspaceName.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.productType.toLowerCase().includes(q)
      );
    }

    // Filters
    if (filterProductType) result = result.filter((w) => w.productType === filterProductType);
    if (filterStage) result = result.filter((w) => w.stage === filterStage);
    if (filterPriority) result = result.filter((w) => w.priority === filterPriority);

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => {
          const aTime = a.createdAt?.toMillis() ?? 0;
          const bTime = b.createdAt?.toMillis() ?? 0;
          return bTime - aTime;
        });
        break;
      case 'updated':
        result.sort((a, b) => {
          const aTime = a.updatedAt?.toMillis() ?? 0;
          const bTime = b.updatedAt?.toMillis() ?? 0;
          return bTime - aTime;
        });
        break;
      case 'alphabetical':
        result.sort((a, b) => a.workspaceName.localeCompare(b.workspaceName));
        break;
      case 'priority':
        result.sort(
          (a, b) =>
            (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
        );
        break;
    }

    return result;
  }, [workspaces, searchQuery, sortBy, filterProductType, filterStage, filterPriority]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterProductType('');
    setFilterStage('');
    setFilterPriority('');
    setSortBy('newest');
  }, []);

  return {
    workspaces,
    filteredWorkspaces,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filterProductType,
    setFilterProductType,
    filterStage,
    setFilterStage,
    filterPriority,
    setFilterPriority,
    clearFilters,
  };
}
