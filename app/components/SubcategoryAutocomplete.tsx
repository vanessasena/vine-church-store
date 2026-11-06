'use client';

import { useEffect, useRef, useState } from 'react';
import { Item } from '@/lib/types';

interface SubcategoryAutocompleteProps {
  categoryId: string;
  items: Item[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function SubcategoryAutocomplete({
  categoryId,
  items,
  value,
  onChange,
  className = '',
  placeholder = '',
}: SubcategoryAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSubcategories, setFilteredSubcategories] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const subcategories = Array.from(new Set(items
    .filter(item => item.category_id === categoryId && item.subcategory)
    .map(item => item.subcategory!.trim())
    .filter(Boolean)))
    .sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setFilteredSubcategories(
      subcategories.filter(subcategory =>
        subcategory.toLowerCase().includes(value.toLowerCase())
      )
    );
  }, [value, items, categoryId]);

  const showAddNew = value.trim() !== '' && !subcategories.some(
    subcategory => subcategory.toLowerCase() === value.trim().toLowerCase()
  );

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id="item-subcategory"
        type="text"
        value={value}
        onChange={event => {
          onChange(event.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showDropdown && (filteredSubcategories.length > 0 || showAddNew) && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredSubcategories.length > 0 && (
            <div className="py-1">
              {filteredSubcategories.map(subcategory => (
                <button
                  key={subcategory}
                  type="button"
                  onClick={() => {
                    onChange(subcategory);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                >
                  {subcategory}
                </button>
              ))}
            </div>
          )}
          {showAddNew && (
            <button
              type="button"
              onClick={() => {
                onChange(value.trim());
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 transition-colors border-t border-gray-200 font-medium text-green-700"
            >
              + Add new: &quot;{value.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
