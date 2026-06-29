// src/components/dashboard/banners/BannerDetailsModal.jsx
import React, { useEffect, useState } from 'react';
import {
    X, Image as ImageIcon, Edit, Trash2, Calendar, Globe, Hash,
    CreditCard, Link as LinkIcon, Layers, ExternalLink,
} from 'lucide-react';
import topicsApi from '../../../api/topicsApi';
import subscriptionsApi from '../../../api/subscriptionsApi';

const typeColors = {
    promotion: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    ad: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    announcement: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

const formatDate = (d) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return '—'; }
};

const Chip = ({ children }) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mr-1 mb-1">
        {children}
    </span>
);

const CsvList = ({ csv }) => {
    if (!csv) return <span className="text-[11px] text-gray-400">All (no restriction)</span>;
    const items = csv.split(',').map(s => s.trim()).filter(Boolean);
    if (items.length === 0) return <span className="text-[11px] text-gray-400">All (no restriction)</span>;
    return (
        <div className="flex flex-wrap gap-0.5 mt-0.5">
            {items.map((v, i) => <Chip key={i}>{v}</Chip>)}
        </div>
    );
};

const MappedList = ({ csv, lookup }) => {
    if (!csv) return <span className="text-[11px] text-gray-400">All (no restriction)</span>;
    const items = csv.split(',').map(s => s.trim()).filter(Boolean);
    if (items.length === 0) return <span className="text-[11px] text-gray-400">All (no restriction)</span>;
    return (
        <div className="flex flex-wrap gap-0.5 mt-0.5">
            {items.map((id, i) => {
                const label = lookup[id] || lookup[Number(id)];
                return <Chip key={i}>{label || `#${id}`}</Chip>;
            })}
        </div>
    );
};

const BannerDetailsModal = ({ isOpen, onClose, banner, onEdit, onDelete }) => {
    const [topicMap, setTopicMap] = useState({});
    const [subMap, setSubMap] = useState({});

    // Fetch topic & subscription labels for human-readable display
    useEffect(() => {
        if (!isOpen) return;
        let active = true;
        (async () => {
            try {
                const res = await topicsApi.getTopics({ limit: 100 });
                if (!active) return;
                const map = {};
                (res.data?.data || []).forEach(t => { map[t.id] = t.topic_name || t.name || `Topic ${t.id}`; });
                setTopicMap(map);
            } catch { /* silent */ }
        })();
        (async () => {
            try {
                const res = await subscriptionsApi.getSubscriptions({ limit: 100 });
                if (!active) return;
                const map = {};
                (res.data?.data || []).forEach(s => {
                    map[s.id] = s.subscription_name
                        ? `${s.subscription_name}${s.subscription_type ? ` (${s.subscription_type})` : ''}`
                        : `Subscription ${s.id}`;
                });
                setSubMap(map);
            } catch { /* silent */ }
        })();
        return () => { active = false; };
    }, [isOpen]);

    if (!isOpen || !banner) return null;

    const isActive = banner.is_active === true || banner.is_active === 1;
    const typeClass = typeColors[banner.banner_type] || typeColors.promotion;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[9999] animate-in fade-in duration-200 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-purple-100 dark:border-gray-700 flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-purple-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <ImageIcon className="text-purple-600 dark:text-purple-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Banner Details</h2>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">ID: {banner.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarGutter: 'stable' }}>

                    {/* Image preview */}
                    {banner.banner_image && (
                        <div>
                            <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Banner Image</h3>
                            <img
                                src={banner.banner_image}
                                alt={banner.banner_title || 'Banner'}
                                className="w-full max-h-64 object-cover rounded-lg border border-purple-100 dark:border-gray-700"
                            />
                        </div>
                    )}

                    {/* Title + Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Title</h3>
                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {banner.banner_title || <span className="italic text-gray-400 font-normal">Untitled</span>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                                <Layers size={10} /> Type
                            </h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${typeClass}`}>
                                {banner.banner_type || 'promotion'}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    {banner.banner_description && (
                        <div>
                            <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Description</h3>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
                                {banner.banner_description}
                            </div>
                        </div>
                    )}

                    {/* Link */}
                    {banner.banner_link && (
                        <div>
                            <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                                <LinkIcon size={10} /> Link
                            </h3>
                            <a
                                href={banner.banner_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 break-all"
                            >
                                <ExternalLink size={12} />
                                {banner.banner_link}
                            </a>
                        </div>
                    )}

                    {/* Status / Display Order */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Status</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${isActive
                                ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                                : 'text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700'
                                }`}>
                                <span className={`w-1 h-1 rounded-full mr-1.5 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Display Order</h3>
                            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                {banner.display_order ?? 0}
                            </span>
                        </div>
                    </div>

                    {/* Scheduling */}
                    <div className="pt-3 border-t border-purple-100 dark:border-gray-700">
                        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                            <Calendar size={14} className="text-purple-500" />
                            Scheduling
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Valid From</h4>
                                <div className="text-sm text-gray-700 dark:text-gray-300">{formatDate(banner.valid_from)}</div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Valid Until</h4>
                                <div className="text-sm text-gray-700 dark:text-gray-300">{formatDate(banner.valid_until)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Targeting */}
                    <div className="pt-3 border-t border-purple-100 dark:border-gray-700">
                        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                            <Globe size={14} className="text-green-500" />
                            Target (show to)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase flex items-center gap-1">
                                    <Globe size={9} /> Countries
                                </h4>
                                <CsvList csv={banner.target_countries} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase flex items-center gap-1">
                                    <Hash size={9} /> Topics
                                </h4>
                                <MappedList csv={banner.target_topic_ids} lookup={topicMap} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase flex items-center gap-1">
                                    <CreditCard size={9} /> Subscriptions
                                </h4>
                                <MappedList csv={banner.target_subscription_ids} lookup={subMap} />
                            </div>
                        </div>
                    </div>

                    {/* Exclusions */}
                    <div className="pt-3 border-t border-purple-100 dark:border-gray-700">
                        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                            <Globe size={14} className="text-red-500" />
                            Exclude (hide from)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">Countries</h4>
                                <CsvList csv={banner.excluded_countries} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">Topics</h4>
                                <MappedList csv={banner.excluded_topic_ids} lookup={topicMap} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">Subscriptions</h4>
                                <MappedList csv={banner.excluded_subscription_ids} lookup={subMap} />
                            </div>
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div className="pt-3 border-t border-purple-100 dark:border-gray-700 grid grid-cols-2 gap-4 text-[11px] text-gray-500 dark:text-gray-400">
                        <div>Created: {formatDate(banner.created_at)}</div>
                        <div>Updated: {formatDate(banner.updated_at)}</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        {onDelete && (
                            <button
                                onClick={() => { onDelete(banner.id); onClose(); }}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs font-medium"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        )}
                        {onEdit && (
                            <button
                                onClick={() => { onEdit(banner); onClose(); }}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs font-medium"
                            >
                                <Edit size={14} />
                                Edit
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 purple-gradient text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md active:scale-95 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BannerDetailsModal;
