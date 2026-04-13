import { useState, useRef } from "react";
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
}: LocationSearchProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout>();

    const searchLocation = async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsLoading(true);
        try {
            // Using Nominatim - simple and reliable
            const response = await axios.get(
                "https://nominatim.openstreetmap.org/search",
                {
                    params: {
                        q: query,
                        format: "json",
                        limit: 500, // Maximum results
                        addressdetails: 1,
                    },
                    headers: {
                        "User-Agent": "multi-hop-delivery/1.0",
                    },
                    timeout: 10000,
                }
            );

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        onChange(text);
        setShowSuggestions(true);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            searchLocation(text);
        }, 400);
    };

    const handleSelectSuggestion = (suggestion: Suggestion) => {
        const name = suggestion.display_name.split(",")[0];
        onChange(name);
        onSelect({
            name: name,
            lat: parseFloat(suggestion.lat),
            lng: parseFloat(suggestion.lon),
        });
        setShowSuggestions(false);
    };

    return (
        <div style={{ position: "relative", marginBottom: "10px" }}>
            <input
                placeholder={placeholder}
                value={value}
                onChange={handleInputChange}
                style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                }}
            />

            {isLoading && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderTop: "none",
                        padding: "10px",
                        fontSize: "12px",
                        color: "#666",
                        zIndex: 10,
                    }}
                >
                    ⏳ Searching...
                </div>
            )}

            {showSuggestions && suggestions.length > 0 && !isLoading && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderTop: "none",
                        borderRadius: "0 0 4px 4px",
                        maxHeight: "600px",
                        overflowY: "auto",
                        zIndex: 10,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                >
                    <div
                        style={{
                            padding: "8px 12px",
                            borderBottom: "1px solid #eee",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#666",
                            background: "#f5f5f5",
                            position: "sticky",
                            top: 0,
                        }}
                    >
                        📍 {suggestions.length} locations
                    </div>
                    {suggestions.map((suggestion, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            style={{
                                padding: "10px 12px",
                                borderBottom: "1px solid #f0f0f0",
                                cursor: "pointer",
                                fontSize: "13px",
                                backgroundColor: "#fff",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor =
                                    "#f9f9f9";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor =
                                    "#fff";
                            }}
                        >
                            <div style={{ fontWeight: "500", marginBottom: "2px" }}>
                                {suggestion.display_name.split(",")[0]}
                            </div>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#999",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {suggestion.display_name}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showSuggestions &&
                suggestions.length === 0 &&
                value.length > 1 &&
                !isLoading && (
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            background: "#fff",
                            border: "1px solid #ccc",
                            borderTop: "none",
                            borderRadius: "0 0 4px 4px",
                            padding: "12px",
                            fontSize: "13px",
                            color: "#999",
                            textAlign: "center",
                            zIndex: 10,
                        }}
                    >
                        🔍 No locations found
                    </div>
                )}
        </div>
    );
}