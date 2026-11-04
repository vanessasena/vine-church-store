'use client';

import { useId, useState } from 'react';
import { Item } from '@/lib/types';

interface ItemPickerProps {
  items: Item[];
  onSelect: (item: Item) => void;
  clickedItemId: string | null;
  preferredCategory?: string;
  scrollable?: boolean;
}

export default function ItemPicker({ items, onSelect, clickedItemId, preferredCategory, scrollable = false }: ItemPickerProps) {
  const searchId = useId();
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const groups = new Map<string, { category: string; subcategory: string; items: Item[] }>();
  const normalizeCategory = (category: string) => category
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();

  for (const item of items) {
    const category = item.category?.name || 'Unknown';
    const subcategory = item.subcategory?.trim() || '';
    const key = JSON.stringify([item.category_id, subcategory.toLocaleLowerCase()]);
    const group = groups.get(key);
    if (group) {
      group.items.push(item);
    } else {
      groups.set(key, { category, subcategory, items: [item] });
    }
  }

  const sortedGroups = Array.from(groups.entries()).sort(([, a], [, b]) => {
    const aIsDonation = normalizeCategory(a.category) === 'doacao';
    const bIsDonation = normalizeCategory(b.category) === 'doacao';
    if (aIsDonation !== bIsDonation) return aIsDonation ? 1 : -1;

    const normalizedPreferred = preferredCategory ? normalizeCategory(preferredCategory) : '';
    const aIsPreferred = normalizedPreferred !== '' && normalizeCategory(a.category) === normalizedPreferred;
    const bIsPreferred = normalizedPreferred !== '' && normalizeCategory(b.category) === normalizedPreferred;
    if (aIsPreferred !== bIsPreferred) return aIsPreferred ? -1 : 1;

    return a.category.localeCompare(b.category) ||
      (a.subcategory ? (b.subcategory ? a.subcategory.localeCompare(b.subcategory) : -1) : (b.subcategory ? 1 : 0));
  });
  const activeGroup = groups.has(selectedGroup) ? selectedGroup : '';
  const query = search.trim().toLocaleLowerCase();
  const visibleGroups = sortedGroups
    .filter(([key]) => !activeGroup || key === activeGroup)
    .map(([key, group]) => ({
      key,
      ...group,
      items: group.items.filter(item =>
        `${item.name} ${group.category} ${group.subcategory || 'Other'}`.toLocaleLowerCase().includes(query)
      ).sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter(group => group.items.length > 0);

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={searchId} className="block text-sm font-medium text-gray-700 mb-1">
          Search items
        </label>
        <input
          id={searchId}
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
          placeholder="Search by name or subcategory"
          className="w-full min-h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {sortedGroups.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter by subcategory">
          <button
            type="button"
            aria-pressed={!activeGroup}
            onClick={() => setSelectedGroup('')}
            className={`shrink-0 min-h-11 px-4 py-2 rounded-full text-sm font-medium ${
              !activeGroup ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All subcategories
          </button>
          {sortedGroups.map(([key, group]) => (
            <button
              key={key}
              type="button"
              aria-pressed={activeGroup === key}
              onClick={() => setSelectedGroup(key)}
              className={`shrink-0 min-h-11 px-4 py-2 rounded-full text-sm font-medium ${
                activeGroup === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {group.category} · {group.subcategory || 'Other'}
            </button>
          ))}
        </div>
      )}
      <div className={`space-y-4 ${scrollable ? 'max-h-96 overflow-y-auto' : ''}`}>
        {visibleGroups.map(group => (
          <section key={group.key} aria-label={`${group.category} · ${group.subcategory || 'Other'}`}>
            <h4 className="font-semibold text-gray-800 bg-gray-100 rounded-md px-3 py-2 mb-2 break-words">
              {group.category} · {group.subcategory || 'Other'}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {group.items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  aria-label={`Add ${item.name}`}
                  className={`min-h-20 min-w-0 p-3 border rounded-md transition-all text-left break-words touch-manipulation ${
                    clickedItemId === item.id
                      ? 'bg-green-100 border-green-500 scale-95 shadow-inner'
                      : 'border-gray-300 hover:bg-blue-50 hover:border-blue-500'
                  }`}
                >
                  {item.image_url && (
                    <img src={item.image_url} alt="" className="w-full h-24 object-cover rounded-md mb-2" />
                  )}
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm font-semibold text-green-600">
                    {item.has_custom_price ? (
                      <span className="text-purple-600">Custom Price</span>
                    ) : (
                      `$${item.price?.toFixed(2) || '0.00'}`
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
        {visibleGroups.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            {items.length === 0 ? 'No items available in this category.' : 'No items match your search in this subcategory.'}
          </p>
        )}
      </div>
    </div>
  );
}
