// src/components/dashboard/banners/BannerRow.jsx
import React from 'react';
import { Edit, Trash2, Eye, Image as ImageIcon, ExternalLink } from 'lucide-react';

const typeColors = {
    promotion: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    ad: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    announcement: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

const formatDate = (date) => {
    if (!date) return '—';
    try {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    } catch {
        return '—';
    }
};

const BannerRow = React.memo(({ banner, serialNumber, onEdit, onDelete, onViewDetails, onToggleActive }) => {
    const isActive = banner.is_active === true || banner.is_active === 1;
    const typeClass = typeColors[banner.banner_type] || typeColors.promotion;

    const hasTargeting = banner.target_countries || banner.target_topic_ids ||
        banner.target_subscription_ids || banner.excluded_countries ||
        banner.excluded_topic_ids || banner.excluded_subscription_ids;

    return (
        <tr className="hover:bg-purple-50/30 dark:hover:bg-gray-700/30 transition-colors">
            {/* # */}
            <td className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {serialNumber}
            </td>

            {/* Banner (image + title) */}
            <td className="p-3">
                <div className="flex items-center gap-2.5">
                    {banner.banner_image ? (
                        <img
                            src={banner.banner_image}
                            alt={banner.banner_title || 'Banner'}
                            className="w-12 h-8 rounded object-cover border border-purple-100 dark:border-gray-700 bg-gray-100"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ) : (
                        <div className="w-12 h-8 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <ImageIcon size={14} className="text-purple-500" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="font-semibold text-xs text-gray-800 dark:text-gray-100 truncate max-w-[220px]">
                            {banner.banner_title || <span className="italic text-gray-400">Untitled</span>}
                        </div>
                        {banner.banner_description && (
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
                                {banner.banner_description}
                            </div>
                        )}
                    </div>
                </div>
            </td>

            {/* Type */}
            <td className="p-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${typeClass}`}>
                    {banner.banner_type || 'promotion'}
                </span>
            </td>

            {/* Link */}
            <td className="p-3">
                {banner.banner_link ? (
                    <a
                        href={banner.banner_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-700 dark:text-purple-400 truncate max-w-[160px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink size={10} />
                        <span className="truncate">{banner.banner_link.replace(/^https?:\/\//, '')}</span>
                    </a>
                ) : (
                    <span className="text-[11px] text-gray-400">—</span>
                )}
            </td>

            {/* Targeting */}
            <td className="p-3">
                {hasTargeting ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        Targeted
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        Everyone
                    </span>
                )}
            </td>

            {/* Order */}
            <td className="p-3 text-center">
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                    {banner.display_order ?? 0}
                </span>
            </td>

            {/* Status */}
            <td className="p-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${isActive
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                    : 'text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700'
                    }`}>
                    <span className={`w-1 h-1 rounded-full mr-1.5 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {isActive ? 'Active' : 'Inactive'}
                </span>
            </td>

            {/* Validity */}
            <td className="p-3 text-[11px] text-gray-500 dark:text-gray-400">
                <div className="flex flex-col">
                    <span>From: {formatDate(banner.valid_from)}</span>
                    <span>Until: {formatDate(banner.valid_until)}</span>
                </div>
            </td>

            {/* Actions */}
            <td className="p-3 text-right">
                <div className="flex items-center justify-end gap-1">
                    {/* Active toggle */}
                    <label className="relative inline-flex items-center cursor-pointer mr-1">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => {
                                e.stopPropagation();
                                onToggleActive?.(banner.id, !isActive);
                            }}
                            className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-gray-200 dark:bg-gray-600 rounded-full peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all" />
                    </label>

                    <button
                        type="button"
                        onClick={() => onViewDetails?.(banner)}
                        className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                        title="View details"
                    >
                        <Eye size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit?.(banner)}
                        className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                        title="Edit"
                    >
                        <Edit size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete?.(banner.id)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </td>
        </tr>
    );
});

export default BannerRow;
