import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Globe, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface HotelSuggestion {
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
}

interface HotelAutocompleteProps {
  value?: string;
  onSelect: (hotel: HotelSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function HotelAutocomplete({ 
  value = '', 
  onSelect, 
  placeholder = "Inizia a digitare il nome del tuo hotel...",
  disabled = false,
  className
}: HotelAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Search hotels using the API
  const { data: suggestions = [], isLoading } = useQuery<HotelSuggestion[]>({
    queryKey: ['/api/hotels/search', debouncedQuery],
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Update isOpen based on suggestions and focus
  useEffect(() => {
    setIsOpen(suggestions.length > 0 && query.length >= 2);
    setSelectedIndex(-1);
  }, [suggestions, query]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // Handle hotel selection
  const handleSelectHotel = (hotel: HotelSuggestion) => {
    setQuery(hotel.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(hotel);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectHotel(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && query.length >= 2) {
              setIsOpen(true);
            }
          }}
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

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-96 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {suggestions.map((hotel: HotelSuggestion, index: number) => (
            <div
              key={hotel.placeId}
              className={cn(
                "px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50",
                selectedIndex === index && "bg-blue-50"
              )}
              onClick={() => handleSelectHotel(hotel)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {hotel.name}
                  </h4>
                  <div className="flex items-center mt-1 text-xs text-gray-600">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{hotel.formattedAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {hotel.city}
                    </Badge>
                    {hotel.region && (
                      <Badge variant="outline" className="text-xs">
                        {hotel.region}
                      </Badge>
                    )}
                    {hotel.postalCode && (
                      <Badge variant="outline" className="text-xs">
                        {hotel.postalCode}
                      </Badge>
                    )}
                  </div>
                  {(hotel.phone || hotel.website) && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {hotel.phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {hotel.phone}
                        </div>
                      )}
                      {hotel.website && (
                        <div className="flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          Sito web
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && suggestions.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            Nessun hotel trovato per "{query}"
            <br />
            <span className="text-xs">Prova ad aggiungere la città (es. "Hotel Roma Milano")</span>
          </div>
        </div>
      )}
    </div>
  );
}