'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/use-locale';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={t('common.search') + " (is:exotic, stat:resilience:>20)"}
        className="input-field pl-10 pr-10"
      />
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--forge-text-muted)]">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      {query && (
        <button 
          onClick={handleClear}
          className="absolute inset-y-0 right-3 flex items-center text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
