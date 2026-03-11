import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, X } from 'lucide-react';

interface Suggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    city?: string;
    town?: string;
    suburb?: string;
    neighbourhood?: string;
    state?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: Suggestion) => void;
  placeholder?: string;
  label?: string;
  iconColor?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Digite o endereço...',
  label,
  iconColor = '#4a9eff'
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggestions from Nominatim
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Add Brazil bias and limit to SC state for better results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&accept-language=pt-BR&countrycodes=br&addressdetails=1`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      );
      
      const data = await response.json();
      setSuggestions(data || []);
      setHighlightedIndex(-1);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (value.trim()) {
        fetchSuggestions(value);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, fetchSuggestions]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.display_name);
    onSelect(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Format suggestion display
  const formatSuggestion = (suggestion: Suggestion): string => {
    const addr = suggestion.address;
    if (!addr) return suggestion.display_name;
    
    // Extract relevant parts
    const city = addr.city || addr.town || '';
    const neighbourhood = addr.suburb || addr.neighbourhood || '';
    
    if (neighbourhood && city) {
      return `${neighbourhood}, ${city}`;
    }
    
    // Fallback to shortened display name
    const parts = suggestion.display_name.split(',');
    if (parts.length >= 2) {
      return `${parts[0].trim()}, ${parts[1].trim()}`;
    }
    
    return suggestion.display_name;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm text-white/60 mb-1.5">{label}</label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
          <Search size={18} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => value.length >= 3 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#4a9eff] focus:ring-1 focus:ring-[#4a9eff] transition-all"
          autoComplete="off"
        />
        
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
          >
            <X size={18} />
          </button>
        )}
        
        {loading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#2d2d2d]/95 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl max-h-72 overflow-y-auto">
          <div className="py-2">
            <div className="px-4 py-1.5 text-xs text-white/40 uppercase tracking-wider">
              Sugestões
            </div>
            
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full px-4 py-3 text-left flex items-start gap-3 transition-all ${
                  index === highlightedIndex 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/5'
                }`}
              >
                <MapPin 
                  size={18} 
                  className="mt-0.5 flex-shrink-0" 
                  style={{ color: iconColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {formatSuggestion(suggestion)}
                  </p>
                  <p className="text-white/50 text-xs truncate mt-0.5">
                    {suggestion.display_name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !loading && value.length >= 3 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#2d2d2d]/95 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl">
          <div className="px-4 py-4 text-center">
            <p className="text-white/50 text-sm">
              Nenhum resultado encontrado
            </p>
            <p className="text-white/30 text-xs mt-1">
              Tente digitar o nome completo do bairro ou cidade
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
