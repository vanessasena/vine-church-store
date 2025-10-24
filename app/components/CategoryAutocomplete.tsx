'use client';

import { useState, useEffect, useRef } from 'react';

interface CategoryAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export default function CategoryAutocomplete({
  value,
  onChange,
  className = '',
  placeholder = 'e.g., Beverages',
  required = false,
}: CategoryAutocompleteProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Filter categories based on input value
    if (value) {
      const filtered = categories.filter((cat) =>
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [value, categories]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const selectCategory = (category: string) => {
    onChange(category);
    setShowDropdown(false);
  };

  const isExactMatch = categories.some(
    (cat) => cat.toLowerCase() === value.toLowerCase()
  );

  const showAddNew = value.trim() !== '' && !isExactMatch;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        required={required}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showDropdown && (filteredCategories.length > 0 || showAddNew) && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredCategories.length > 0 && (
            <div className="py-1">
              {filteredCategories.map((category, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectCategory(category)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          )}
          {showAddNew && (
            <button
              type="button"
              onClick={() => selectCategory(value)}
              className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 transition-colors border-t border-gray-200 font-medium text-green-700"
            >
              + Add new: "{value}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
