import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Globe, Loader2, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface AttractionSuggestion {
  placeId: string;
  name: string;
  formattedAddress: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  category: string;
  primaryType: string;
  types: string[];
  rating: string;
  userRatingCount: number;
  priceRange: string;
  openingHours: string;
}

interface AttractionAutocompleteProps {
  value?: string;
  onSelect: (attraction: AttractionSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  hotelId?: string;
}

export function AttractionAutocomplete({ 
  value = '', 
  onSelect, 
  placeholder = "Cerca musei, ristoranti, parchi...",
  disabled = false,
  className,
  hotelId
}: AttractionAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Search attractions using the API
  const { data: suggestions = [], isLoading, error } = useQuery<AttractionSuggestion[]>({
    queryKey: [`/api/attractions/search?query=${encodeURIComponent(debouncedQuery)}${hotelId ? `&hotelId=${hotelId}` : ''}`],
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  console.log('AttractionAutocomplete search:', {
    query: debouncedQuery,
    suggestions: suggestions.length,
    isLoading,
    error: error?.message
  });

  // Handle clicks outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setFocusedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          handleSelect(suggestions[focusedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (attraction: AttractionSuggestion) => {
    setQuery(attraction.name);
    setShowDropdown(false);
    setFocusedIndex(-1);
    onSelect(attraction);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setShowDropdown(newValue.length >= 2);
    setFocusedIndex(-1);
  };

  const handleInputFocus = () => {
    if (query.length >= 2) {
      setShowDropdown(true);
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {showDropdown && debouncedQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto mt-1">
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Cercando attrazioni...
            </div>
          ) : error ? (
            <div className="p-3 text-center text-red-500 text-sm">
              Errore nella ricerca: {error.message}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              Nessuna attrazione trovata per "{debouncedQuery}"
            </div>
          ) : (
            suggestions.map((attraction, index) => (
              <button
                key={attraction.placeId}
                onClick={() => handleSelect(attraction)}
                className={cn(
                  "w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors",
                  focusedIndex === index && "bg-blue-50"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm leading-tight">
                        {attraction.name}
                      </h4>
                      <div className="flex items-center text-xs text-blue-600 mt-1">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{attraction.city}, {attraction.region}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {attraction.category}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    {attraction.rating && (
                      <div className="flex items-center">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                        <span>{attraction.rating}</span>
                        {attraction.userRatingCount > 0 && (
                          <span className="ml-1">({attraction.userRatingCount})</span>
                        )}
                      </div>
                    )}
                    
                    {attraction.priceRange && (
                      <div className="flex items-center">
                        <span>{attraction.priceRange}</span>
                      </div>
                    )}

                    {attraction.phone && (
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        <span className="truncate">{attraction.phone}</span>
                      </div>
                    )}

                    {attraction.website && (
                      <div className="flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        <span>Sito web</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 truncate">
                    {attraction.formattedAddress}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}