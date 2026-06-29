// src/components/dashboard/posts/EditPostModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Hash, FilePlus, Tag, Hash as Hashtag, AlertCircle } from 'lucide-react';
import topicsApi from '../../../api/topicsApi';
import TopicsPickerModal from '../../common/TopicsPickerModal';

const EditPostModal = React.memo(({
  isOpen,
  onClose,
  post,
  onSave
}) => {
  const [formData, setFormData] = useState({
    post_title: '',
    post_content: '',
    post_slug: '',
    post_topic_id: '',
    post_status: 'published',
    post_tags: [],
    post_image: '',
    post_video: '',
    post_audio: '',
    post_link: '',
    community_ids: [],
    is_featured: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [error, setError] = useState(null);

  // Fetch topics when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTopics();
    }
  }, [isOpen]);

  const fetchTopics = async () => {
    try {
      setLoadingTopics(true);
      const response = await topicsApi.getTopicsForSelectList();
      if (response?.data) {
        setTopics(response.data);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    } finally {
      setLoadingTopics(false);
    }
  };

  useEffect(() => {
    if (post) {
      // Map post data to API format - handle both transformed list items and raw API objects
      setFormData({
        post_title: post.title || post.post_title || post.raw?.post_title || '',
        post_content: post.content || post.post_content || post.raw?.post_content || '',
        post_slug: post.post_slug || post.raw?.post_slug || '',
        post_topic_id: post.post_topic_id || post.raw?.post_topic_id || '',
        post_status: post.post_status || post.raw?.post_status || 'published',
        post_tags: post.tags || post.post_tags || (post.raw?.post_tags ? (typeof post.raw.post_tags === 'string' ? post.raw.post_tags.split(',').map(t => t.trim()).filter(Boolean) : post.raw.post_tags) : []),
        post_image: post.post_image || post.raw?.post_image || '',
        post_video: post.post_video || post.raw?.post_video || '',
        post_audio: post.post_audio || post.raw?.post_audio || '',
        post_link: post.post_link || post.raw?.post_link || '',
        community_ids: post.community_ids || post.raw?.community_ids || [],
        is_featured: !!(post.is_featured || post.raw?.is_featured)
      });
    }
  }, [post]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      let updated;
      updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Auto-generate slug from title
      if (name === 'post_title' && value) {
        updated.post_slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      return updated;
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.post_tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        post_tags: [...prev.post_tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      post_tags: prev.post_tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare FormData according to API spec (multipart/form-data)
      const formDataToSend = new FormData();

      // Include all form fields that have values (all optional for update according to API)
      // Always include fields that are filled in the form
      if (formData.post_title) {
        formDataToSend.append('post_title', formData.post_title);
      }
      if (formData.post_content) {
        formDataToSend.append('post_content', formData.post_content);
      }
      if (formData.post_slug) {
        formDataToSend.append('post_slug', formData.post_slug);
      }
      if (formData.post_topic_id) {
        formDataToSend.append('post_topic_id', formData.post_topic_id);
      }
      if (formData.post_status) {
        formDataToSend.append('post_status', formData.post_status);
      }
      if (formData.post_tags && Array.isArray(formData.post_tags) && formData.post_tags.length > 0) {
        formData.post_tags.forEach(tag => {
          formDataToSend.append('post_tags[]', tag);
        });
      }
      if (formData.post_image) {
        formDataToSend.append('post_image', formData.post_image);
      }
      if (formData.post_video) {
        formDataToSend.append('post_video', formData.post_video);
      }
      if (formData.post_audio) {
        formDataToSend.append('post_audio', formData.post_audio);
      }
      if (formData.post_link) {
        formDataToSend.append('post_link', formData.post_link);
      }
      if (formData.community_ids && Array.isArray(formData.community_ids) && formData.community_ids.length > 0) {
        formData.community_ids.forEach(id => {
          formDataToSend.append('community_ids[]', id);
        });
      }
      // Always include is_featured (boolean)
      formDataToSend.append('is_featured', formData.is_featured ? 'featured' : 'not_featured');

      // FormData will always have at least is_featured, so it's always a valid update
      // The API accepts all fields as optional for updates, so any field change is valid

      await onSave(post.id, formDataToSend);
      onClose();
    } catch (err) {
      console.error('Error updating post:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to update post. Please try again.';
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      post_title: '',
      post_content: '',
      post_slug: '',
      post_topic_id: '',
      post_status: 'published',
      post_tags: [],
      post_image: '',
      post_video: '',
      post_audio: '',
      post_link: '',
      community_ids: [],
      is_featured: false
    });
    setNewTag('');
    onClose();
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90%] h-[90vh] flex flex-col border border-purple-100 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Fixed Modal Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-purple-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 transition-colors">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-100 dark:border-gray-700">
              <img
                src={post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.name || 'user'}`}
                alt={post.author?.name || 'User'}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 transition-colors">Edit Post</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Update post content and settings</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <form id="edit-post-form" onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarGutter: 'stable' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Post Title - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  <div className="flex items-center space-x-1.5">
                    <FilePlus size={14} className="text-purple-500 dark:text-purple-400" />
                    <span>Post Title *</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="post_title"
                  value={formData.post_title}
                  onChange={handleInputChange}
                  required
                  maxLength={255}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                  placeholder="Enter post title"
                  disabled={isSubmitting}
                />
                {/* Auto-generated Slug Display */}
                {formData.post_slug && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Hash size={12} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Slug:</span>
                    <code className="text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-700 font-mono">
                      {formData.post_slug}
                    </code>
                  </div>
                )}
              </div>

              {/* Topic and Status - Side by side */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  <div className="flex items-center space-x-1.5">
                    <Tag size={14} className="text-purple-500 dark:text-purple-400" />
                    <span>Topic (Optional)</span>
                  </div>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-h-[38px] px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 flex items-center justify-between">
                    {formData.post_topic_id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                          {(() => {
                            for (const parent of topics) {
                              if (parent.id === formData.post_topic_id) return parent.name;
                              if (parent.children) {
                                const child = parent.children.find(c => c.id === formData.post_topic_id);
                                if (child) return child.name;
                              }
                            }
                            return 'Selected Topic';
                          })()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, post_topic_id: '' }))}
                          className="p-0.5 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full transition-colors"
                        >
                          <X size={12} className="text-purple-400" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">No topic selected</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTopicsModal(true)}
                    className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-xs"
                    disabled={isSubmitting || loadingTopics}
                  >
                    Select
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  Post Status
                </label>
                <select
                  name="post_status"
                  value={formData.post_status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                  disabled={isSubmitting}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Post Content - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  Post Content *
                </label>
                <textarea
                  name="post_content"
                  value={formData.post_content}
                  onChange={handleInputChange}
                  required
                  rows="5"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all resize-none"
                  placeholder="Write your post content here..."
                  disabled={isSubmitting}
                />
              </div>

              {/* Tags - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
                  Tags (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.post_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs transition-colors"
                    >
                      <Hashtag size={10} className="mr-1" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1.5 text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                        disabled={isSubmitting}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Hash className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Add a tag..."
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none transition-all"
                      disabled={isSubmitting}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm"
                    disabled={isSubmitting}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Featured Toggle - Full width */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors">
                      Featured Post
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Mark this post as featured</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={!!formData.is_featured}
                      onChange={handleInputChange}
                      className="sr-only peer"
                      disabled={isSubmitting}
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Modal Footer */}
          <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-medium transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-post-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 purple-gradient hover:bg-gradient-to-r hover:from-purple-700 hover:to-purple-900 text-white rounded-lg transition-all text-xs font-semibold shadow-md active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>

        <TopicsPickerModal
          isOpen={showTopicsModal}
          onClose={() => setShowTopicsModal(false)}
          initialSelectedIds={formData.post_topic_id}
          multiple={false}
          onSave={(selectedId) => setFormData(prev => ({ ...prev, post_topic_id: selectedId }))}
        />
      </div>
    </div>
  );
});

EditPostModal.displayName = 'EditPostModal';
export default EditPostModal;
