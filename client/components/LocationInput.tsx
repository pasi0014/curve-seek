import React, { useState, useEffect, useRef, useCallback } from "react";
import type { GeocodedPlace } from "../types";
import { debounce } from "../utils/helpers";
import { inputClasses, labelClasses } from "../utils/tw";

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
    <div className="relative" ref={containerRef}>
      <label className={labelClasses}>{label}</label>
      <input
        type="text"
        className={inputClasses}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowList(true)}
        autoComplete="off"
      />
      {showList && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 z-50 bg-slate-900 border border-slate-700 border-t-0 rounded-b-md max-h-[200px] overflow-y-auto list-none" role="listbox">
          {suggestions.map((place, i) => (
            <li
              key={`${place.name}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`px-4 py-3 text-[13px] cursor-pointer transition-colors duration-150 border-b border-slate-700 last:border-b-0 ${
                i === activeIndex
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-400 hover:bg-slate-700 hover:text-slate-100"
              }`}
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
