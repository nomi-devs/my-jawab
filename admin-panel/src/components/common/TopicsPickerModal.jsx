import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Tag, Search, Check } from 'lucide-react';
import topicsApi from '../../api/topicsApi';

/**
 * Reusable modal to pick one or many topics.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - initialSelectedIds: number[] or number
 * - onSave: (selectedIds: number[] | number | null) => void
 * - multiple: boolean (default true)
 */
const TopicsPickerModal = React.memo(
  ({ isOpen, onClose, initialSelectedIds = [], onSave, multiple = true }) => {
    const { t } = useTranslation('common');
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Normalize initialSelectedIds to array internal state
    const [selectedIds, setSelectedIds] = useState([]);

    // Reset internal state when modal opens
    useEffect(() => {
      if (isOpen) {
        let normalized = [];
        if (Array.isArray(initialSelectedIds)) {
          normalized = initialSelectedIds;
        } else if (initialSelectedIds) {
          normalized = [initialSelectedIds];
        }
        setSelectedIds(normalized);
        setSearchTerm('');
        fetchTopics();
      }
    }, [isOpen, initialSelectedIds]);

    const fetchTopics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await topicsApi.getTopicsForSelectList();
        if (response?.data) {
          setTopics(response.data);
        } else {
          setTopics([]);
        }
      } catch (err) {
        console.error('Error fetching topics for picker:', err);
        setError(t('topicsPicker.loadFailed'));
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    const handleSave = () => {
      if (onSave) {
        if (multiple) {
          onSave(selectedIds);
        } else {
          onSave(selectedIds.length > 0 ? selectedIds[0] : null);
        }
      }
      onClose?.();
    };

    const handleClose = () => {
      onClose?.();
    };

    const toggleTopic = (topicId) => {
      if (multiple) {
        setSelectedIds((prev) =>
          prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId],
        );
      } else {
        // Single selection: if already selected, deselect; otherwise replace
        setSelectedIds((prev) => (prev.includes(topicId) ? [] : [topicId]));
      }
    };

    const filteredTopics = useMemo(() => {
      if (!searchTerm.trim()) return topics;
      const lower = searchTerm.toLowerCase();

      return topics
        .map((parent) => {
          const parentMatches = parent.name && parent.name.toLowerCase().includes(lower);
          const matchingChildren =
            parent.children?.filter(
              (child) => child.name && child.name.toLowerCase().includes(lower),
            ) || [];

          if (parentMatches || matchingChildren.length > 0) {
            return {
              ...parent,
              children: parentMatches ? parent.children : matchingChildren,
            };
          }
          return null;
        })
        .filter(Boolean);
    }, [topics, searchTerm]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col border border-purple-100 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-purple-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Tag className="text-purple-600 dark:text-purple-400" size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  {multiple ? t('topicsPicker.selectTopics') : t('topicsPicker.selectTopic')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {multiple
                    ? t('topicsPicker.chooseMultipleSubtitle')
                    : t('topicsPicker.chooseSingleSubtitle')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              <X size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Search bar */}
          <div className="px-5 py-3 border-b border-purple-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80">
            <div className="relative">
              <Search
                size={14}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('topicsPicker.searchPlaceholder')}
                className="w-full ps-8 pe-3 py-1.5 text-xs rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-1 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {/* Body */}
          <div
            className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
            style={{ scrollbarGutter: 'stable' }}
          >
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400 rounded-full animate-spin" />
                  <span>{t('topicsPicker.loadingTopics')}</span>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-red-500 mb-2">{error}</p>
                <button
                  type="button"
                  onClick={fetchTopics}
                  className="px-3 py-1.5 text-xs rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  {t('retry')}
                </button>
              </div>
            )}

            {!loading && !error && filteredTopics.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="text-2xl mb-2 text-gray-300 dark:text-gray-600">#</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('topicsPicker.noTopicsFound')}
                </p>
              </div>
            )}

            {!loading && !error && filteredTopics.length > 0 && (
              <div className="space-y-4">
                {filteredTopics.map((parent) => {
                  const childCount = parent.children?.length || 0;
                  return (
                    <div
                      key={parent.id}
                      className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-900/40"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {parent.image ? (
                            <img
                              src={parent.image}
                              alt={parent.name || 'Topic'}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-[12px] font-semibold text-purple-700 dark:text-purple-300 flex-shrink-0">
                              {parent.name?.[0]?.toUpperCase() || '#'}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {parent.name}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              {t('topicsPicker.topicsCount', { count: childCount })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {childCount > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {parent.children.map((child) => {
                            const isSelected = selectedIds.includes(child.id);
                            return (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => toggleTopic(child.id)}
                                className={`px-3 py-1 rounded-full border text-[11px] flex items-center gap-1 transition-all ${
                                  isSelected
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-gray-800/80'
                                }`}
                              >
                                <span>{child.name}</span>
                                {isSelected && <Check size={10} className="ms-1" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-5 py-3 border-t border-purple-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-1.5 rounded-lg border border-purple-200 dark:border-gray-600 text-purple-600 dark:text-purple-400 text-xs font-medium hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
              disabled={loading}
            >
              {t('topicsPicker.confirmSelection')} {selectedIds.length > 0 && `(${selectedIds.length})`}
            </button>
          </div>
        </div>
      </div>
    );
  },
);

TopicsPickerModal.displayName = 'TopicsPickerModal';
export default TopicsPickerModal;
