import { useRef, useState, type ChangeEvent } from "react";
import axios from "axios";

type Point = {
    lat: number;
    lng: number;
};

type LocationSearchProps = {
    placeholder: string;
    value: string;
    onChange: (text: string) => void;
    onSelect: (location: Point & { name: string }) => void;
    accentColor?: string;
};

type Suggestion = {
    lat: string;
    lon: string;
    display_name: string;
};

export default function LocationSearch({
    placeholder,
    value,
    onChange,
    onSelect,
    accentColor = "#7c4dff",
}: LocationSearchProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const searchLocation = async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get("https://nominatim.openstreetmap.org/search", {
                params: {
                    q: query,
                    format: "json",
                    limit: 120,
                    addressdetails: 1,
                },
                headers: {
                    "User-Agent": "multi-hop-delivery/1.0",
                },
                timeout: 10000,
            });

            const results = (response.data || []) as Suggestion[];
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
        } catch (error) {
            console.error("Search error:", error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        onChange(text);
        setShowSuggestions(true);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            searchLocation(text);
        }, 350);
    };

    const handleSelectSuggestion = (suggestion: Suggestion) => {
        const name = suggestion.display_name.split(",")[0];
        onChange(name);
        onSelect({
            name,
            lat: parseFloat(suggestion.lat),
            lng: parseFloat(suggestion.lon),
        });
        setShowSuggestions(false);
    };

    return (
        <div className="location-search" style={{ ["--search-accent" as string]: accentColor }}>
            <input
                className="location-input"
                placeholder={placeholder}
                value={value}
                onChange={handleInputChange}
                onFocus={() => {
                    if (suggestions.length > 0) {
                        setShowSuggestions(true);
                    }
                }}
            />

            {isLoading && <div className="search-dropdown search-loading">Searching...</div>}

            {showSuggestions && suggestions.length > 0 && !isLoading && (
                <div className="search-dropdown">
                    <div className="search-dropdown-header">{suggestions.length} locations</div>
                    {suggestions.map((suggestion, idx) => (
                        <button
                            key={`${suggestion.lat}-${suggestion.lon}-${idx}`}
                            type="button"
                            className="search-option"
                            onClick={() => handleSelectSuggestion(suggestion)}
                        >
                            <span className="search-option-title">
                                {suggestion.display_name.split(",")[0]}
                            </span>
                            <span className="search-option-copy">{suggestion.display_name}</span>
                        </button>
                    ))}
                </div>
            )}

            {showSuggestions &&
                suggestions.length === 0 &&
                value.length > 1 &&
                !isLoading && (
                    <div className="search-dropdown search-empty">
                        No locations found. Use map pick mode for exact coordinates.
                    </div>
                )}
        </div>
    );
}
