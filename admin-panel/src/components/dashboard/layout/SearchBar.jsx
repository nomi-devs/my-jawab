// src/components/dashboard/layout/SearchBar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  X,
  Clock,
  Users,
  Hash,
  Globe,
  FileText,
  ImageIcon,
  Video,
  Music,
} from 'lucide-react';
import searchApi from '../../../api/searchApi';

// Helper function to format numbers (e.g., 125000 -> "125k")
const formatNumber = (num) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

// Load recent searches from localStorage
const loadRecentSearches = () => {
  try {
    const stored = localStorage.getItem('recentSearches');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save recent searches to localStorage
const saveRecentSearches = (searches) => {
  try {
    localStorage.setItem('recentSearches', JSON.stringify(searches));
  } catch {
    // Ignore localStorage errors
  }
};

const SearchBar = React.memo(() => {
  const { t } = useTranslation('layout');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [recentSearches, setRecentSearches] = useState(loadRecentSearches());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchApi.globalSearch({
        q: query.trim(),
        limit: 5,
      });

      // Debug: Log raw API response
      console.log('Raw API response:', response.data);

      // Transform API response to match component's expected format
      const transformedResults = {
        users: (response.data.users || []).map((user) => ({
          id: user.id,
          name: user.name || user.username || 'Unknown User',
          handle: user.handle || `@${user.username || 'user'}`,
          type: 'user',
          avatar: user.avatar,
          role: user.role,
        })),
        posts: (response.data.posts || []).map((post) => ({
          id: post.id,
          title: post.title || post.post_title || 'Untitled Post',
          slug: post.slug || post.post_slug,
          status: post.status || post.post_status || 'draft',
          views: formatNumber(post.view_count || 0),
          likes: formatNumber(post.like_count || 0),
          comments: formatNumber(post.comment_count || 0),
          type: 'post',
          thumbnail: post.post_image || null,
          post_image: post.post_image || null,
          post_video: post.post_video || null,
          post_audio: post.post_audio || null,
          author: post.user
            ? {
                name: post.user.name || post.user.username,
                handle: post.user.handle || `@${post.user.username || 'user'}`,
              }
            : null,
          created_at: post.created_at,
        })),
        communities: (response.data.communities || []).map((community) => ({
          id: community.id,
          name: community.name || community.community_name,
          members: formatNumber(community.member_count || 0),
          type: 'community',
          slug: community.slug || community.community_slug,
          image: community.community_image || null,
        })),
        topics: (response.data.topics || []).map((topic) => {
          const originalName = topic.name || topic.topic_name || 'topic';
          return {
            id: topic.id,
            name: originalName.startsWith('#') ? originalName : `#${originalName}`,
            originalName: originalName, // Store original name without hash for searching
            posts: formatNumber(topic.posts_count || 0),
            type: 'topic',
            slug: topic.slug || topic.topic_slug,
          };
        }),
      };

      // Debug: Log the transformed results to see what we're getting
      console.log('Search results transformed:', transformedResults);
      setSearchResults(transformedResults);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || t('search.searchFailed'));
      setSearchResults({
        users: [],
        posts: [],
        communities: [],
        topics: [],
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults(null);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Add to recent searches if not already there
      const searchTerm = searchQuery.toLowerCase().trim();
      if (!recentSearches.includes(searchTerm)) {
        const updated = [searchTerm, ...recentSearches.slice(0, 4)];
        setRecentSearches(updated);
        saveRecentSearches(updated);
      }

      // Perform search action
      performSearch(searchQuery);
      setIsFocused(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleRecentSearchClick = (term) => {
    // Remove hash (#) from topic searches
    const cleanedTerm = term.startsWith('#') ? term.substring(1).trim() : term.trim();

    // Set the cleaned search query
    setSearchQuery(cleanedTerm);

    // Keep dropdown open and perform search
    setIsFocused(true);

    // Perform search with cleaned term
    if (cleanedTerm) {
      performSearch(cleanedTerm);
    } else {
      setSearchResults(null);
    }
  };

  const handleResultClick = (item) => {
    // Get search term and remove hash (#) if it's a topic
    let searchTerm = (item.name || item.title || '').toLowerCase().trim();

    // Remove hash from topic names before saving to recent searches
    if (item.type === 'topic' && searchTerm.startsWith('#')) {
      searchTerm = searchTerm.substring(1).trim();
    }

    setSearchQuery('');
    setSearchResults(null);
    setIsFocused(false);

    // Add to recent searches (without hash for topics)
    if (searchTerm && !recentSearches.includes(searchTerm)) {
      const updated = [searchTerm, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      saveRecentSearches(updated);
    }

    // Navigate to the appropriate page based on item type
    switch (item.type) {
      case 'user':
        // Navigate to users page with search filter
        navigate('/users', { state: { searchUserId: item.id, searchQuery: item.name } });
        break;
      case 'post':
        // Navigate to posts page with search filter
        navigate('/posts', { state: { searchPostId: item.id, searchQuery: item.title } });
        break;
      case 'community':
        // Navigate to communities page with search filter
        navigate('/communities', { state: { searchCommunityId: item.id, searchQuery: item.name } });
        break;
      case 'topic':
        // Navigate to topics page with search filter
        // Use originalName if available, otherwise remove hash from displayed name
        const topicSearchQuery =
          item.originalName ||
          (item.name.startsWith('#') ? item.name.substring(1).trim() : item.name);
        navigate('/topics', { state: { searchTopicId: item.id, searchQuery: topicSearchQuery } });
        break;
      default:
        console.log('Unknown item type:', item.type);
    }
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'post':
        return <FileText className="w-4 h-4 text-orange-500" />;
      case 'community':
        return <Globe className="w-4 h-4 text-blue-500" />;
      case 'topic':
        return <Hash className="w-4 h-4 text-green-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <div
          className={`hidden md:flex items-center bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border transition-all duration-200 ${
            isFocused
              ? 'border-purple-500 dark:border-purple-400 shadow-purple-glow'
              : 'border-purple-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-gray-500'
          }`}
        >
          <Search
            size={18}
            className={`me-2 ${isFocused ? 'text-purple-500 dark:text-purple-400' : 'text-purple-400 dark:text-gray-400'}`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={t('search.placeholder')}
            className="bg-transparent border-none outline-none text-sm w-64 placeholder-purple-300 dark:placeholder-gray-500 text-gray-700 dark:text-gray-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="ms-2 p-1 hover:bg-purple-50 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X size={16} className="text-gray-400 dark:text-gray-500" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {(isFocused || searchQuery) && (
        <div
          className="absolute top-full end-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-purple-100 dark:border-gray-700 z-50 animate-in slide-in-from-top-5 duration-200 transition-colors overflow-hidden flex flex-col"
          style={{
            maxHeight: 'calc(100vh - 120px)',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          {/* Search Results Content - Scrollable */}
          <div
            className="p-3 overflow-y-auto flex-1 search-results-scroll"
            style={{
              scrollbarGutter: 'stable',
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-purple-200 dark:border-purple-700 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin"></div>
              </div>
            ) : searchQuery ? (
              error ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-red-500 dark:text-red-400 transition-colors">
                    {error}
                  </p>
                </div>
              ) : searchResults ? (
                <>
                  {/* Users Results */}
                  {searchResults.users.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 px-1 tracking-wider transition-colors">
                        {t('search.users')}
                      </h4>
                      <div className="space-y-1">
                        {searchResults.users.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleResultClick(user)}
                            className="w-full flex items-center p-2.5 hover:bg-purple-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-150 text-left group active:scale-[0.98]"
                          >
                            {user.avatar ? (
                              <div className="w-9 h-9 rounded-lg overflow-hidden me-2.5 shrink-0 border border-purple-200 dark:border-gray-600">
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML =
                                      '<div class="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center"><svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center me-2.5 shrink-0 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/60 transition-colors">
                                {getResultIcon(user.type)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 transition-colors truncate">
                                {user.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors truncate">
                                {user.handle}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posts Results */}
                  {searchResults.posts && searchResults.posts.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 px-1 tracking-wider transition-colors">
                        {t('search.posts')}
                      </h4>
                      <div className="space-y-1">
                        {searchResults.posts.map((post) => {
                          // Check for images - handle null, undefined, and empty strings
                          const hasImage =
                            (post.thumbnail && post.thumbnail.trim()) ||
                            (post.post_image && post.post_image.trim());
                          const hasVideo = post.post_video && post.post_video.trim();
                          const hasAudio = post.post_audio && post.post_audio.trim();

                          // Debug: Log post data to see what we have
                          if (post.id) {
                            console.log(
                              `Post ${post.id} - thumbnail: ${post.thumbnail}, post_image: ${post.post_image}, hasImage: ${hasImage}`,
                            );
                          }

                          return (
                            <button
                              key={post.id}
                              onClick={() => handleResultClick(post)}
                              className="w-full flex items-center p-2.5 hover:bg-purple-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-150 text-left group active:scale-[0.98]"
                            >
                              {hasImage ? (
                                <div className="w-9 h-9 rounded-lg overflow-hidden me-2.5 shrink-0 border border-orange-200 dark:border-gray-600 relative">
                                  <img
                                    src={
                                      (post.thumbnail && post.thumbnail.trim()) ||
                                      (post.post_image && post.post_image.trim())
                                    }
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerHTML =
                                        '<div class="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center"><svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                    }}
                                  />
                                  {hasVideo && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                      <Video size={12} className="text-white" />
                                    </div>
                                  )}
                                </div>
                              ) : hasVideo ? (
                                <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center me-2.5 shrink-0 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 transition-colors relative">
                                  <Video size={16} className="text-orange-500" />
                                </div>
                              ) : hasAudio ? (
                                <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center me-2.5 shrink-0 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 transition-colors relative">
                                  <Music size={16} className="text-orange-500" />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center me-2.5 shrink-0 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 transition-colors">
                                  {getResultIcon(post.type)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 transition-colors truncate">
                                  {post.title}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors truncate">
                                  {post.author ? `${post.author.name} • ` : ''}
                                  {post.views} {t('search.views')} • {post.likes} {t('search.likes')}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Communities Results */}
                  {searchResults.communities.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 px-1 tracking-wider transition-colors">
                        {t('search.communities')}
                      </h4>
                      <div className="space-y-1">
                        {searchResults.communities.map((community) => {
                          // Check for image - handle null, undefined, and empty strings
                          const hasImage = community.image && community.image.trim();

                          return (
                            <button
                              key={community.id}
                              onClick={() => handleResultClick(community)}
                              className="w-full flex items-center p-2.5 hover:bg-purple-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-150 text-left group active:scale-[0.98]"
                            >
                              {hasImage ? (
                                <div className="w-9 h-9 rounded-lg overflow-hidden me-2.5 shrink-0 border border-blue-200 dark:border-gray-600">
                                  <img
                                    src={community.image}
                                    alt={community.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerHTML =
                                        '<div class="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center"><svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center me-2.5 shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors">
                                  {getResultIcon(community.type)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 transition-colors truncate">
                                  {community.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors truncate">
                                  {community.members} {t('search.members')}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Topics Results */}
                  {searchResults.topics.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 px-1 tracking-wider transition-colors">
                        {t('search.topics')}
                      </h4>
                      <div className="space-y-1">
                        {searchResults.topics.map((topic) => (
                          <button
                            key={topic.id}
                            onClick={() => handleResultClick(topic)}
                            className="w-full flex items-center p-2.5 hover:bg-purple-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-150 text-left group active:scale-[0.98]"
                          >
                            <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center me-2.5 shrink-0 group-hover:bg-green-200 dark:group-hover:bg-green-900/60 transition-colors">
                              {getResultIcon(topic.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 transition-colors truncate">
                                {topic.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors truncate">
                                {topic.posts} {t('search.postsCount')}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {(!searchResults.posts || searchResults.posts.length === 0) &&
                    searchResults.users.length === 0 &&
                    searchResults.communities.length === 0 &&
                    searchResults.topics.length === 0 && (
                      <div className="py-10 text-center">
                        <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2.5" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                          {t('search.noResultsFor')}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold mt-1 transition-colors">
                          "{searchQuery}"
                        </p>
                      </div>
                    )}
                </>
              ) : null
            ) : (
              /* Recent Searches */
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider transition-colors">
                    {t('search.recentSearches')}
                  </h4>
                  <button
                    onClick={() => {
                      setRecentSearches([]);
                      saveRecentSearches([]);
                    }}
                    className="text-[10px] text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium"
                  >
                    {t('search.clearAll')}
                  </button>
                </div>
                <div className="space-y-1 mb-4">
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(term)}
                      className="w-full flex items-center p-2.5 hover:bg-purple-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-150 text-left group active:scale-[0.98]"
                    >
                      <Clock
                        size={14}
                        className="text-gray-400 dark:text-gray-500 me-2.5 shrink-0"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors truncate">
                        {term}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="pt-4 border-t border-purple-100 dark:border-gray-700">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 px-1 font-medium transition-colors">
                    {t('search.tryLabel')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['users', 'communities', 'analytics', 'reports'].map((term) => (
                      <button
                        key={term}
                        onClick={() => handleRecentSearchClick(term)}
                        className="px-2.5 py-1 text-[11px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-md transition-colors font-medium"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';
export default SearchBar;
