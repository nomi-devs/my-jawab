// src/components/common/MultiSelectField.jsx
// Reusable multi-select dropdown with selected chips and search.
//
// Props:
//   - options:   [{ id, label }]  (required)
//   - value:     number[] | string[]  — array of selected IDs
//   - onChange:  (newIds) => void
//   - placeholder: string (shown when nothing selected)
//   - loading:   boolean  — show a skeleton instead of options
//   - disabled:  boolean
//   - searchable: boolean (default true)
//   - maxHeight: number   — dropdown max height in px (default 240)
//
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Search, Check, Loader2 } from 'lucide-react';

const MultiSelectField = ({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select items...',
  loading = false,
  disabled = false,
  searchable = true,
  maxHeight = 240,
  emptyText = 'No options available',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Normalize value to strings for comparison (in case of number/string mix)
  const selectedIds = useMemo(() => value.map((v) => String(v)), [value]);

  const selectedOptions = useMemo(
    () => options.filter((o) => selectedIds.includes(String(o.id))),
    [options, selectedIds],
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) => String(o.label).toLowerCase().includes(q) || String(o.id).toLowerCase().includes(q),
    );
  }, [options, search]);

  const toggleItem = (id) => {
    if (disabled) return;
    const idStr = String(id);
    const next = selectedIds.includes(idStr)
      ? value.filter((v) => String(v) !== idStr)
      : [...value, id];
    onChange?.(next);
  };

  const removeItem = (e, id) => {
    e.stopPropagation();
    if (disabled) return;
    onChange?.(value.filter((v) => String(v) !== String(id)));
  };

  const clearAll = (e) => {
    e.stopPropagation();
    if (disabled) return;
    onChange?.([]);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Selected chips + dropdown trigger */}
      <div
        onClick={() => !disabled && setIsOpen((o) => !o)}
        className={`min-h-[40px] w-full px-3 py-1.5 rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 text-sm flex items-center gap-1 flex-wrap cursor-pointer transition-all ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-purple-400 focus-within:ring-2 focus-within:ring-purple-200 dark:focus-within:ring-purple-900'
        }`}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-xs text-gray-400 dark:text-gray-500 px-1">{placeholder}</span>
        ) : (
          selectedOptions.map((opt) => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-[11px] font-medium"
            >
              {opt.label}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => removeItem(e, opt.id)}
                  className="hover:text-purple-900 dark:hover:text-purple-100"
                >
                  <X size={11} />
                </button>
              )}
            </span>
          ))
        )}

        <div className="ml-auto flex items-center gap-1">
          {selectedOptions.length > 0 && !disabled && (
            <button
              type="button"
              onClick={clearAll}
              className="p-0.5 text-gray-400 hover:text-red-500"
              title="Clear all"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-600 rounded-lg shadow-lg animate-in fade-in duration-150"
          style={{ maxHeight: `${maxHeight + 40}px` }}
        >
          {/* Search */}
          {searchable && (
            <div className="p-2 border-b border-purple-100 dark:border-gray-700">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${maxHeight}px`, scrollbarGutter: 'stable' }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 size={16} className="animate-spin mr-2" />
                <span className="text-xs">Loading...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                {options.length === 0 ? emptyText : 'No matches'}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedIds.includes(String(opt.id));
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleItem(opt.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors ${
                      isSelected ? 'bg-purple-50/50 dark:bg-gray-700/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'border-purple-600 bg-purple-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                      </div>
                      <span
                        className={`truncate ${isSelected ? 'text-purple-700 dark:text-purple-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                      >
                        {opt.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                      #{opt.id}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer count */}
          {selectedOptions.length > 0 && (
            <div className="px-3 py-2 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-[10px] text-gray-500 flex items-center justify-between">
              <span>{selectedOptions.length} selected</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-red-500 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectField;
