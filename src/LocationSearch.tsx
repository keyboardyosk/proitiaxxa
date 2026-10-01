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

export default function LocationSearch({ onSelect, placeholder = 'Адрес или место', selectedPoint }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    
    debounceRef.current = setTimeout(async () => {
      try {
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
          headers: { 'User-Agent': 'ProitiSPB/1.0' }
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
      if (debounceRef.current) clearTimeout(debounceRef.current);
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
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 bg-white border border-line-soft rounded-none font-sans text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-ink transition-colors"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-line border-t-ink rounded-full animate-spin"></div>
          </div>
        )}
        {query && !isSearching && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
            aria-label="Очистить"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-0 bg-white border border-line-soft shadow-sm max-h-64 overflow-y-auto">
          {results.map((result, i) => (
            <button
              key={`${result.lat}-${result.lon}-${i}`}
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-paper border-b border-line-soft/40 last:border-b-0 transition-colors"
            >
              <p className="text-sm text-ink truncate">
                {result.display_name.split(',').slice(0, 2).join(',')}
              </p>
              <p className="text-xs text-ink-muted truncate mt-0.5 font-mono">
                {parseFloat(result.lat).toFixed(3)}°, {parseFloat(result.lon).toFixed(3)}°
              </p>
            </button>
          ))}
        </div>
      )}

      {selectedPoint && !isOpen && (
        <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted font-mono">
          <span className="w-1.5 h-1.5 bg-route"></span>
          <span>{selectedPoint.lat.toFixed(4)}°, {selectedPoint.lon.toFixed(4)}°</span>
        </div>
      )}
    </div>
  );
}
