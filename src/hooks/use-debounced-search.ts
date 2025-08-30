/**
 * Debounced Search Hook
 * Epic 2: Story 2.1 - Core Trip Management
 * Performance-optimized search with debouncing
 */

import { useCallback, useEffect, useState } from 'react';

interface UseSearchDebounceOptions {
  delay?: number;
  minLength?: number;
}

export function useSearchDebounce(
  initialValue: string = '',
  options: UseSearchDebounceOptions = {}
) {
  const { delay = 300, minLength = 2 } = options;

  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(true);

    const handler = setTimeout(() => {
      if (searchTerm.length >= minLength || searchTerm.length === 0) {
        setDebouncedSearchTerm(searchTerm);
      }
      setIsSearching(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay, minLength]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setIsSearching(false);
  }, []);

  const setSearchTermImmediate = useCallback((term: string) => {
    setSearchTerm(term);
    setDebouncedSearchTerm(term);
    setIsSearching(false);
  }, []);

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    setSearchTerm,
    setSearchTermImmediate,
    clearSearch,
  };
}
