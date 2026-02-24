import React, { useState, useEffect, useRef, useCallback } from "react";
import type { GeocodedPlace } from "../types";
import { debounce } from "../utils/helpers";

interface LocationInputProps {
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (text: string) => void;
  onSelect: (place: GeocodedPlace) => void;
}

export function LocationInput({
  label,
  placeholder,
  value,
  onValueChange,
  onSelect,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [showList, setShowList] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(q)}`
        );
        if (res.ok) {
          const data: GeocodedPlace[] = await res.json();
          setSuggestions(data);
          setShowList(data.length > 0);
          setActiveIndex(-1);
        }
      } catch {
        /* network error, ignore */
      }
    }, 300),
    []
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    onValueChange(text);
    fetchSuggestions(text);
  }

  function handleSelect(place: GeocodedPlace) {
    onValueChange(place.name);
    onSelect(place);
    setSuggestions([]);
    setShowList(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showList || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowList(false);
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowList(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="input-group" ref={containerRef}>
      <label>{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowList(true)}
        autoComplete="off"
      />
      {showList && suggestions.length > 0 && (
        <ul className="autocomplete-list" role="listbox">
          {suggestions.map((place, i) => (
            <li
              key={`${place.name}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              data-active={i === activeIndex ? "true" : undefined}
              onMouseDown={() => handleSelect(place)}
            >
              {place.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
