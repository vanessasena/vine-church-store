'use client';

import { useState, useEffect, useRef } from 'react';

interface Category {
  id: string;
  name: string;
  created_at?: string;
}

interface CategoryAutocompleteProps {
  value: string;
  onChange: (value: string, categoryId?: string) => void;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
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
        cat.name.toLowerCase().includes(value.toLowerCase())
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

  const createCategory = async (name: string) => {
    setIsCreatingCategory(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories(prev => [...prev, newCategory]);
        onChange(newCategory.name, newCategory.id);
        setShowDropdown(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    } finally {
      setIsCreatingCategory(false);
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

  const selectCategory = (category: Category) => {
    onChange(category.name, category.id);
    setShowDropdown(false);
  };

  const isExactMatch = categories.some(
    (cat) => cat.name.toLowerCase() === value.toLowerCase()
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
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
          {showAddNew && (
            <button
              type="button"
              onClick={() => createCategory(value.trim())}
              disabled={isCreatingCategory}
              className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 transition-colors border-t border-gray-200 font-medium text-green-700 disabled:opacity-50"
            >
              {isCreatingCategory ? 'Creating...' : `+ Add new: "${value}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
