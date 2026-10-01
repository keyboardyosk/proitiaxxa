import { useState, useEffect, useRef } from 'react';
import { GeoPoint } from './types';

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface LocationSearchProps {
  onSelect: (point: GeoPoint) => void;
  placeholder?: string;
  selectedPoint?: GeoPoint | null;
}

export default function LocationSearch({ onSelect, placeholder = 'Введите адрес или место', selectedPoint }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне компонента
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Поиск с debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    
    debounceRef.current = setTimeout(async () => {
      try {
        // Поиск только по Санкт-Петербургу
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          limit: '6',
          countrycodes: 'ru',
          viewbox: '30.05,60.15,30.65,59.72',
          bounded: '1',
          'accept-language': 'ru',
        });
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: {
            'User-Agent': 'ProitiSPB/1.0'
          }
        });
        const data: SearchResult[] = await response.json();
        setResults(data);
        setIsOpen(data.length > 0);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    const point: GeoPoint = {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      name: result.display_name,
    };
    onSelect(point);
    setQuery(result.display_name.split(',').slice(0, 2).join(','));
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-stone-300 rounded-lg font-serif text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-800/30 focus:border-blue-800 transition-all bg-white"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-stone-300 border-t-blue-800 rounded-full animate-spin"></div>
          </div>
        )}
        {query && !isSearching && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((result, i) => (
            <button
              key={`${result.lat}-${result.lon}-${i}`}
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-50 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm text-stone-700 truncate">
                    {result.display_name.split(',').slice(0, 2).join(',')}
                  </p>
                  <p className="text-xs text-stone-400 truncate mt-0.5">
                    {result.display_name.split(',').slice(2, 4).join(',').trim()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected point display */}
      {selectedPoint && !isOpen && (
        <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{selectedPoint.lat.toFixed(4)}, {selectedPoint.lon.toFixed(4)}</span>
        </div>
      )}
    </div>
  );
}
